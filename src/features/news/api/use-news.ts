import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { isCmsConfigured } from '@/shared/config/cms';
import { CmsApiError, newsApi } from './news-client';
import type { NewsQuery } from './news-types';

const NEWS_STALE_TIME = 5 * 60 * 1000;

export const newsKeys = {
  all: ['cms', 'news'] as const,
  list: (params: NewsQuery) => [...newsKeys.all, 'list', params] as const,
  article: (id: string) => [...newsKeys.all, 'article', id] as const,
};

/** A 400/404 won't get better by asking again; anything else retries once. */
function retry(failureCount: number, error: unknown) {
  if (error instanceof CmsApiError && [400, 404].includes(error.status)) {
    return false;
  }

  return failureCount < 1;
}

export function useNewsList(params: NewsQuery) {
  return useQuery({
    queryKey: newsKeys.list(params),
    queryFn: () => newsApi.list(params),
    enabled: isCmsConfigured,
    staleTime: NEWS_STALE_TIME,
    // Keep the current page on screen while the next one loads.
    placeholderData: keepPreviousData,
    retry,
  });
}

export function useNewsArticle(id: string | undefined) {
  return useQuery({
    queryKey: newsKeys.article(id ?? ''),
    queryFn: () => newsApi.article(id as string),
    enabled: isCmsConfigured && Boolean(id),
    staleTime: NEWS_STALE_TIME,
    retry,
  });
}
