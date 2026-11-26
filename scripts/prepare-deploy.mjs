// Runs after `vite build`. Writes what Apache on cPanel needs next to the app:
//
// - one pre-rendered HTML file per page and per published news article, so
//   crawlers that don't run JavaScript, and every link preview (LinkedIn,
//   WhatsApp, X, Facebook), get that page's own title, description,
//   canonical, social card and JSON-LD in the first response;
// - robots.txt, 404.html, .htaccess;
// - the PHP in scripts/php, which keeps news live without a redeploy: every
//   article page, /sitemap.xml and /news/rss.xml are answered from the CMS at
//   request time. The pre-rendered articles and sitemap-build.xml are only
//   PHP's fallback for when the CMS can't be reached.
//
// The head tags come from the app's own SEO code (src/prerender.ts), loaded
// through Vite, so the static HTML and the running app never disagree.

import { copyFile, mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createServer } from 'vite';

const distDir = path.resolve('dist');
const mode = process.env.NODE_ENV === 'development' ? 'development' : 'production';

// A throwaway Vite server reads vite.config.ts and .env exactly as the build
// did, so `@/` imports and import.meta.env work in the app's SEO code.
const vite = await createServer({
  mode,
  logLevel: 'warn',
  appType: 'custom',
  server: { middlewareMode: true, hmr: false, ws: false },
  optimizeDeps: { noDiscovery: true, include: [] },
});
const seo = await vite.ssrLoadModule('/src/prerender.ts');
await vite.close();

const siteUrl = seo.absoluteUrl('/');
const siteHost = new URL(siteUrl).host.replace(/^www\./, '');

// ── HTML helpers ──────────────────────────────────────────────────────────────

const escapeHtml = (value) =>
  String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');

const escapeXml = escapeHtml;

/** Turns the router's head() shape into tags. `data-prerender` lets the app
 * remove them on start-up and render its own (see src/main.tsx). */
function renderHead({ meta = [], links = [], scripts = [] }) {
  const tags = [];

  for (const item of meta) {
    if ('title' in item) {
      tags.push(`<title data-prerender>${escapeHtml(item.title)}</title>`);
      continue;
    }
    const attrs = Object.entries(item)
      .map(([key, value]) => `${key}="${escapeHtml(value)}"`)
      .join(' ');
    tags.push(`<meta data-prerender ${attrs} />`);
  }

  for (const link of links) {
    tags.push(
      `<link data-prerender rel="${escapeHtml(link.rel)}" href="${escapeHtml(link.href)}" />`,
    );
  }

  // Already safe for a script body: jsonLd() escapes "<".
  for (const script of scripts) {
    tags.push(
      `<script data-prerender type="${escapeHtml(script.type)}">${script.children}</script>`,
    );
  }

  return tags.join('\n    ');
}

const organizationScript = {
  type: 'application/ld+json',
  children: seo.jsonLd(seo.organizationJsonLd),
};

// The page font is only found once the CSS has loaded (~1 s in on a phone).
// Preloading the Latin subset from the HTML fetches it alongside the CSS.
const fontFile = (await readdir(path.join(distDir, 'assets'))).find((file) =>
  /^geist-latin-wght-normal-.*\.woff2$/.test(file),
);
const fontPreload = fontFile
  ? `<link rel="preload" as="font" type="font/woff2" crossorigin href="${seo.withBasePath(`/assets/${fontFile}`)}" />`
  : '';

/** The built index.html with its placeholder title and description taken out
 * (and, on a re-run, the tags this script wrote into it last time). */
const shellHtml = (await readFile(path.join(distDir, 'index.html'), 'utf8'))
  .replace(/\s*<(title|script)\s+data-prerender[\s\S]*?<\/\1>/g, '')
  .replace(/\s*<(meta|link)\s+data-prerender[\s\S]*?\/>/g, '')
  .replace(/\s*<link rel="preload" as="(?:font|image)"[^>]*>/g, '')
  .replace(/(<meta name="viewport"[^>]*>)/, `$1\n    ${fontPreload}`);

const withHead = (head) =>
  shellHtml.replace(
    '</head>',
    `    ${renderHead({ ...head, scripts: [...(head.scripts ?? []), organizationScript] })}\n  </head>`,
  );

async function writePage(routePath, html) {
  const dir = path.join(distDir, ...routePath.split('/').filter(Boolean));
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, 'index.html'), html);
}

// ── News from the CMS ────────────────────────────────────────────────────────

const PAGE_SIZE = 100; // the CMS maximum

/** Published articles, or [] when the CMS can't be reached. A CMS outage must
 * not block a deploy: news-preview.php still covers articles at request time. */
async function getPublishedArticles() {
  if (!seo.cmsOrigin) {
    console.warn('! VITE_NETPRO_API_URL is not set: no news pages pre-rendered.');
    return [];
  }

  const articles = [];

  try {
    for (let page = 1; ; page += 1) {
      const url = new URL('/api/v1/news', seo.cmsOrigin);
      url.searchParams.set('page', String(page));
      url.searchParams.set('limit', String(PAGE_SIZE));

      const response = await fetch(url, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(15_000),
      });
      if (!response.ok) throw new Error(`status ${response.status} from ${url}`);

      const body = await response.json();
      if (!Array.isArray(body?.news)) throw new Error(`no news list in ${url}`);

      articles.push(...body.news);
      if (body.news.length < PAGE_SIZE) break;
    }
  } catch (error) {
    console.warn(
      `! Could not load news from the CMS (${error.message}). ` +
        'Article pages were not pre-rendered; news-preview.php will serve them.',
    );
    return [];
  }

  return articles.filter(
    (article) => seo.isArticleId(String(article._id)) && article.isActive !== false,
  );
}

const articles = await getPublishedArticles();

// ── Pages ────────────────────────────────────────────────────────────────────

const pages = Object.values(seo.pageSeo);

// The home page's largest element is the hero background, which only the
// JavaScript mentions. Preloading it from the HTML starts the download ~2 s
// sooner on phones. Must match the <img> srcset/sizes in hero-visual.tsx.
const heroPreload = `<link rel="preload" as="image" fetchpriority="high" imagesrcset="${escapeHtml(
  seo.heroImage.srcSet,
)}" imagesizes="${escapeHtml(seo.heroImage.sizes)}" />`;
const withHeroPreload = (html) =>
  html.replace(/(<meta name="viewport"[^>]*>)/, `$1\n    ${heroPreload}`);

await Promise.all([
  ...pages.map((page) =>
    writePage(
      page.path,
      page.path === '/'
        ? withHeroPreload(withHead(seo.routeHead(page)))
        : withHead(seo.routeHead(page)),
    ),
  ),
  ...articles.map((article) =>
    writePage(seo.articlePath(article._id), withHead(seo.articleHead(article))),
  ),
]);

// ── sitemap-build.xml, robots.txt, 404.html, shell.html ──────────────────────

const lastModified = (article) => article.updatedAt || article.createdAt;
const newestArticle = articles.map(lastModified).sort().at(-1);

// Only real dates: a lastmod that changes on every build teaches Google to
// ignore it. changefreq and priority are left out; Google ignores both.
const sitemapEntries = [
  ...pages.map((page) => ({
    loc: seo.absoluteUrl(page.path),
    lastmod: page.path === '/news' ? newestArticle : undefined,
  })),
  ...articles.map((article) => ({
    loc: seo.absoluteUrl(seo.articlePath(article._id)),
    lastmod: lastModified(article),
  })),
];

const sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapEntries
  .map(
    ({ loc, lastmod }) =>
      `  <url>\n    <loc>${escapeXml(loc)}</loc>${
        lastmod ? `\n    <lastmod>${escapeXml(lastmod)}</lastmod>` : ''
      }\n  </url>`,
  )
  .join('\n')}
</urlset>
`;

const robotsContent = `User-agent: *
Allow: /

Sitemap: ${seo.absoluteUrl('/sitemap.xml')}
`;

// Served with a real 404 status for unknown addresses. The app still loads and
// shows its "page not found" screen.
const notFoundHtml = withHead({
  meta: [
    { title: 'Page not found | NetPro International Limited' },
    { name: 'robots', content: 'noindex' },
  ],
});

// ── .htaccess ────────────────────────────────────────────────────────────────

const hostPattern = siteHost.replaceAll('.', '\\.');

const htaccessContent = `# Written by scripts/prepare-deploy.mjs. Edit that file, not this one.

Options -Indexes -MultiViews
DirectoryIndex index.html

# Pre-rendered pages live in folders (about-us/index.html), but their address
# has no trailing slash. Without this, Apache would 301 /about-us to
# /about-us/, away from the canonical URL.
DirectorySlash Off

# Unknown addresses get a real 404, not a "soft 404" copy of the home page.
ErrorDocument 404 ${seo.withBasePath('/404.html')}

<IfModule mod_rewrite.c>
  RewriteEngine On

  # One address per page: https and no www. The CMS only allows the bare
  # domain through CORS, so news would not even load on www.
  RewriteCond %{HTTP_HOST} ^(?:www\\.)?${hostPattern}$ [NC]
  RewriteCond %{HTTPS} !=on
  RewriteCond %{HTTP:X-Forwarded-Proto} !=https
  RewriteRule ^ https://${siteHost}%{REQUEST_URI} [R=301,L]

  RewriteCond %{HTTP_HOST} ^www\\.${hostPattern}$ [NC]
  RewriteRule ^ https://${siteHost}%{REQUEST_URI} [R=301,L]

  # /about-us/ -> /about-us (the canonical form).
  RewriteCond %{REQUEST_URI} ^(.+)/$
  RewriteRule ^ %1 [R=301,L]

  # Internal files: the page shell and PHP helpers are never pages of their own.
  RewriteRule ^(?:shell\\.html|news-lib\\.php|news-config\\.php)$ - [R=404,L]

  # News stays live without a redeploy: PHP reads the CMS on each request
  # (cached a few minutes) for articles, the sitemap and the RSS feed.
  RewriteRule ^sitemap\\.xml$ sitemap.php [L]
  RewriteRule ^news/rss\\.xml$ rss.php [L]
  RewriteRule ^news/([a-fA-F0-9]{24})$ news-preview.php?id=$1 [L,QSA]

  # The build's copy of an article is PHP's fallback, not a second address.
  RewriteCond %{ENV:REDIRECT_STATUS} ^$
  RewriteCond %{REQUEST_URI} ^(.*/news/[a-fA-F0-9]{24})/index\\.html$
  RewriteRule ^ %1 [R=301,L]

  # Pages pre-rendered by the build.
  RewriteCond %{REQUEST_FILENAME}/index.html -f
  RewriteRule ^(.+)$ $1/index.html [L]

  # Anything else that isn't a real file falls through to the 404 page.
</IfModule>

# The live host sent the 520 kB React bundle uncompressed. Text compresses
# to about a third; images and fonts are already compressed.
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/plain text/css text/xml
  AddOutputFilterByType DEFLATE text/javascript application/javascript
  AddOutputFilterByType DEFLATE application/json application/xml image/svg+xml
</IfModule>

<IfModule mod_headers.c>
  # Hashed file names: safe to cache for a year.
  <FilesMatch "\\.(?:js|css|woff2?)$">
    Header set Cache-Control "public, max-age=31536000, immutable"
  </FilesMatch>
  # Images keep their names when replaced, so a month, not a year: a changed
  # image reaches returning visitors within 30 days at worst.
  <FilesMatch "\\.(?:webp|avif|png|jpe?g|gif|svg|ico)$">
    Header set Cache-Control "public, max-age=2592000, stale-while-revalidate=86400"
  </FilesMatch>
  # HTML must always be fresh, or visitors keep loading the previous deploy.
  <FilesMatch "\\.html$">
    Header set Cache-Control "no-cache"
  </FilesMatch>
</IfModule>
`;

// ── PHP: news-config.php plus the scripts in scripts/php ─────────────────────

const phpConfig = {
  siteName: 'NetPro International Limited',
  siteUrl,
  cmsOrigin: seo.cmsOrigin,
  logoUrl: seo.absoluteUrl('/assets/netpro/logo.png'),
  newsDescription: seo.pageSeo.news.description,
  organizationJsonLd: organizationScript.children,
  pages: pages.map((page) => ({
    loc: seo.absoluteUrl(page.path),
    isNews: page.path === '/news',
  })),
};

// A single-quoted PHP string only treats backslash and quote specially.
const phpString = (value) =>
  `'${String(value).replaceAll('\\', '\\\\').replaceAll("'", "\\'")}'`;
const newsConfigPhp = `<?php
// Written by scripts/prepare-deploy.mjs at build time.
return json_decode(${phpString(JSON.stringify(phpConfig))}, true);
`;

const phpSourceDir = path.resolve('scripts/php');
const phpFiles = (await readdir(phpSourceDir)).filter((file) => file.endsWith('.php'));

await Promise.all([
  writeFile(path.join(distDir, 'robots.txt'), robotsContent),
  // /sitemap.xml is generated live by sitemap.php; this copy is what it
  // serves when the CMS can't be reached.
  writeFile(path.join(distDir, 'sitemap-build.xml'), sitemapContent),
  writeFile(path.join(distDir, '.htaccess'), htaccessContent),
  writeFile(path.join(distDir, '404.html'), notFoundHtml),
  // Neutral page shell (no page's tags) that news-preview.php fills in.
  writeFile(path.join(distDir, 'shell.html'), shellHtml),
  writeFile(path.join(distDir, 'news-config.php'), newsConfigPhp),
  ...phpFiles.map((file) =>
    copyFile(path.join(phpSourceDir, file), path.join(distDir, file)),
  ),
]);

console.log(
  `Prepared deploy for ${siteUrl}: ${pages.length} pages and ${articles.length} news article(s) pre-rendered.`,
);
