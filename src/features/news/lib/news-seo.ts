// ─── Search and social tags for one news article ─────────────────────────────
// One source for both places that need them: the router's `head()` while the
// app runs, and scripts/prepare-deploy.mjs, which writes them into
// dist/news/<id>/index.html so crawlers that don't run JavaScript (and every
// link preview) see the story instead of a generic NetPro card.

import type { NewsArticle } from '../api/news-types';
import { getNewsCategory, getNewsImage, getNewsImageAlt, plainText } from './news-utils';
import {
  canonicalUrl,
  defaultOgImage,
  indexableRobots,
  jsonLd,
  pageSeo,
  routeHead,
  siteName,
  type RouteHead,
} from '@/shared/config/seo';

export const articlePath = (id: string) => `/news/${id}`;

const truncate = (text: string, limit: number) =>
  text.length > limit ? `${text.slice(0, limit - 1).trimEnd()}…` : text;

/** Search snippets show about 155–160 characters. */
export const getArticleDescription = (article: NewsArticle) =>
  truncate(plainText(article.content), 160) || pageSeo.news.description;

export function articleJsonLd(article: NewsArticle) {
  const url = canonicalUrl(articlePath(article._id));
  const headline = plainText(article.title);
  const image = getNewsImage(article);
  const organization = {
    '@type': 'Organization',
    name: siteName,
    url: canonicalUrl('/'),
    logo: { '@type': 'ImageObject', url: defaultOgImage },
  };

  return [
    {
      '@context': 'https://schema.org',
      '@type': 'NewsArticle',
      '@id': `${url}#article`,
      mainEntityOfPage: { '@type': 'WebPage', '@id': url },
      url,
      // Google truncates headlines past 110 characters.
      headline: truncate(headline, 110),
      description: getArticleDescription(article),
      ...(image ? { image: [image] } : {}),
      datePublished: article.createdAt,
      dateModified: article.updatedAt || article.createdAt,
      // The page credits "NetPro Newsroom", not a person, so neither do we.
      author: organization,
      publisher: organization,
      articleSection: getNewsCategory(article),
      inLanguage: 'en',
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: canonicalUrl('/') },
        { '@type': 'ListItem', position: 2, name: 'News', item: canonicalUrl('/news') },
        { '@type': 'ListItem', position: 3, name: headline, item: url },
      ],
    },
  ];
}

export function articleHead(article: NewsArticle): RouteHead {
  const url = canonicalUrl(articlePath(article._id));
  const headline = plainText(article.title);
  const title = `${headline} | NetPro News`;
  const description = getArticleDescription(article);
  const image = getNewsImage(article) ?? defaultOgImage;
  const imageAlt = plainText(getNewsImageAlt(article));
  const modified = article.updatedAt || article.createdAt;

  return {
    meta: [
      { title },
      { name: 'description', content: description },
      { name: 'application-name', content: siteName },
      { name: 'robots', content: indexableRobots },
      { property: 'og:site_name', content: siteName },
      { property: 'og:type', content: 'article' },
      { property: 'og:title', content: headline },
      { property: 'og:description', content: description },
      { property: 'og:url', content: url },
      { property: 'og:image', content: image },
      { property: 'og:image:alt', content: imageAlt },
      { property: 'article:published_time', content: article.createdAt },
      { property: 'article:modified_time', content: modified },
      { property: 'article:section', content: getNewsCategory(article) },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: headline },
      { name: 'twitter:description', content: description },
      { name: 'twitter:image', content: image },
      { name: 'twitter:image:alt', content: imageAlt },
    ],
    links: [{ rel: 'canonical', href: url }],
    scripts: articleJsonLd(article).map((data) => ({
      type: 'application/ld+json',
      children: jsonLd(data),
    })),
  };
}

/**
 * While the article loads, or when it can't: the article's own canonical, and
 * `noindex` when the CMS says it doesn't exist, so a dead link never gets
 * indexed as a copy of the news page.
 */
export function articleFallbackHead(id: string, notFound: boolean): RouteHead {
  const base = routeHead({ ...pageSeo.news, path: articlePath(id) });

  if (!notFound) return base;

  return {
    links: [],
    meta: [
      { title: `Article not found | ${siteName}` },
      { name: 'robots', content: 'noindex' },
    ],
  };
}
