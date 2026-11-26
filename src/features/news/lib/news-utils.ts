import { cmsAssetUrl, isModuleDisabled, isNotFound } from '../api/news-client';
import type { NewsArticle } from '../api/news-types';

/** Articles are addressed by CMS id, a 24-character hex ObjectId. The CMS
 * answers anything else with a 500, so a bad URL is "not found" here. */
export const isArticleId = (value: string) => /^[a-f0-9]{24}$/i.test(value);

export const getNewsCategory = (article: NewsArticle) =>
  article.newsTag?.trim() || 'News';

export const getNewsImage = (article: NewsArticle) => {
  const url = article.images[0]?.url;
  return url ? cmsAssetUrl(url) : undefined;
};

export const getNewsImageAlt = (article: NewsArticle) =>
  article.images[0]?.altText || article.title;

export const getNewsDate = (article: NewsArticle) =>
  new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium' }).format(
    new Date(article.createdAt),
  );

const plainText = (html: string) =>
  html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

export const getNewsExcerpt = (article: NewsArticle, length = 150) => {
  const text = plainText(article.content);
  return text.length > length ? `${text.slice(0, length).trimEnd()}…` : text;
};

export const getNewsReadTime = (article: NewsArticle) =>
  `${Math.max(1, Math.ceil(plainText(article.content).split(' ').length / 200))} min read`;

export const NOT_FOUND_COPY = {
  title: 'Article not found',
  detail: 'This story may have been moved or removed. Browse the latest news instead.',
  canRetry: false,
};

/**
 * The one place CMS failures become words people read. Never shows server
 * text, status codes or internal names.
 */
export function newsErrorCopy(
  error: unknown,
  context: 'list' | 'article' = 'list',
) {
  if (isModuleDisabled(error)) {
    return {
      title: 'News is not available',
      detail: 'Updates from NetPro will appear here soon.',
      canRetry: false,
    };
  }

  // A missing article is the reader's dead end; a missing news list means the
  // CMS isn't reachable yet, which reads as "couldn't load" below.
  if (context === 'article' && isNotFound(error)) return NOT_FOUND_COPY;

  return {
    title: 'We couldn’t load the news',
    detail: 'Check your connection and try again in a moment.',
    canRetry: true,
  };
}
