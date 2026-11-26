<?php
// Every /news/<id> request comes here (see .htaccess). It fetches the article
// from the CMS (cached for two minutes) and writes its search and social tags
// into the page shell, so crawlers and link previews always see the current
// title and image, and a deleted article returns a real 404. People get the
// normal app, which takes over from there.
//
// The tags mirror articleHead() in src/features/news/lib/news-seo.ts; keep the
// two in step. If the CMS is down and nothing is cached, the copy the build
// pre-rendered (dist/news/<id>/index.html) is served instead.

declare(strict_types=1);

require __DIR__ . '/news-lib.php';

const ARTICLE_TTL = 120;

$id = $_GET['id'] ?? '';
if (!is_string($id) || !preg_match('/^[a-f0-9]{24}$/i', $id)) {
    news_send_file('404.html', 404);
}
$id = strtolower($id);

$result = news_cms_get('/api/v1/news?id=' . rawurlencode($id), ARTICLE_TTL);
$article = is_array($result['data']['news'] ?? null) ? $result['data']['news'] : null;
$cmsAnswered = $result['status'] >= 200 && $result['status'] < 300;

// The CMS says it doesn't exist (or isn't published): a real 404.
if ($result['status'] === 404 || ($cmsAnswered && ($article === null || !news_is_published($article)))) {
    news_send_file('404.html', 404, 'public, max-age=60');
}

// CMS unreachable and nothing cached: the build's copy, or the bare app.
if ($article === null) {
    if (is_file(__DIR__ . '/news/' . $id . '/index.html')) {
        news_send_file('news/' . $id . '/index.html', 200);
    }
    news_send_file('shell.html', 200);
}

$shell = @file_get_contents(__DIR__ . '/shell.html');
if ($shell === false) {
    news_send_file('index.html', 200);
}

// ── Tags ────────────────────────────────────────────────────────────────────
$config = news_config();
$headline = news_article_title($article);
$description = news_article_description($article);
$url = news_article_url($article);
$articleImage = news_article_image($article);
$image = $articleImage ?? $config['logoUrl'];
$imageAlt = news_plain((string) (($article['images'][0]['altText'] ?? '') ?: ($article['title'] ?? '')));
$category = news_article_category($article);
$published = news_article_published($article);
$modified = news_article_modified($article);
$json = static function (array $data): string {
    return str_replace('<', '<', (string) json_encode($data, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE));
};

$organization = [
    '@type' => 'Organization',
    'name' => $config['siteName'],
    'url' => $config['siteUrl'],
    'logo' => ['@type' => 'ImageObject', 'url' => $config['logoUrl']],
];

$newsArticle = [
    '@context' => 'https://schema.org',
    '@type' => 'NewsArticle',
    '@id' => $url . '#article',
    'mainEntityOfPage' => ['@type' => 'WebPage', '@id' => $url],
    'url' => $url,
    'headline' => news_truncate($headline, 110),
    'description' => $description,
];
if ($articleImage !== null) {
    $newsArticle['image'] = [$articleImage];
}
$newsArticle += [
    'datePublished' => $published,
    'dateModified' => $modified,
    'author' => $organization,
    'publisher' => $organization,
    'articleSection' => $category,
    'inLanguage' => 'en',
];

$breadcrumbs = [
    '@context' => 'https://schema.org',
    '@type' => 'BreadcrumbList',
    'itemListElement' => [
        ['@type' => 'ListItem', 'position' => 1, 'name' => 'Home', 'item' => $config['siteUrl']],
        ['@type' => 'ListItem', 'position' => 2, 'name' => 'News', 'item' => news_url('/news')],
        ['@type' => 'ListItem', 'position' => 3, 'name' => $headline, 'item' => $url],
    ],
];

$meta = [
    ['name', 'description', $description],
    ['name', 'application-name', $config['siteName']],
    ['name', 'robots', 'index, follow, max-image-preview:large'],
    ['property', 'og:site_name', $config['siteName']],
    ['property', 'og:type', 'article'],
    ['property', 'og:title', $headline],
    ['property', 'og:description', $description],
    ['property', 'og:url', $url],
    ['property', 'og:image', $image],
    ['property', 'og:image:alt', $imageAlt],
    ['property', 'article:published_time', $published],
    ['property', 'article:modified_time', $modified],
    ['property', 'article:section', $category],
    ['name', 'twitter:card', 'summary_large_image'],
    ['name', 'twitter:title', $headline],
    ['name', 'twitter:description', $description],
    ['name', 'twitter:image', $image],
    ['name', 'twitter:image:alt', $imageAlt],
];

$tags = ['<title data-prerender>' . news_e($headline . ' | NetPro News') . '</title>'];
foreach ($meta as [$attr, $key, $value]) {
    $tags[] = '<meta data-prerender ' . $attr . '="' . news_e($key) . '" content="' . news_e($value) . '" />';
}
$tags[] = '<link data-prerender rel="canonical" href="' . news_e($url) . '" />';
$tags[] = '<script data-prerender type="application/ld+json">' . $json($newsArticle) . '</script>';
$tags[] = '<script data-prerender type="application/ld+json">' . $json($breadcrumbs) . '</script>';
$tags[] = '<script data-prerender type="application/ld+json">' . $config['organizationJsonLd'] . '</script>';

http_response_code(200);
header('Content-Type: text/html; charset=utf-8');
header('Cache-Control: public, max-age=120');
echo str_replace('</head>', '    ' . implode("\n    ", $tags) . "\n  </head>", $shell);
