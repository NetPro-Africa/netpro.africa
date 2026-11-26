// ─── NetPro CMS client (news only) ────────────────────────────────────────────
// Trimmed port of the UAES `services/netpro` client: typed errors, the
// MODULE_DISABLED case, and a JSON check so an HTML page never gets parsed.

import { cmsApiBaseUrl, cmsOrigin } from '@/shared/config/cms';
import type {
  NewsArticleResponse,
  NewsListResponse,
  NewsQuery,
} from './news-types';

export class CmsApiError extends Error {
  readonly status: number;
  readonly code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'CmsApiError';
    this.status = status;
    this.code = code;
  }
}

/** The CMS has news switched off: hide news, don't show an error. */
export function isModuleDisabled(error: unknown) {
  return error instanceof CmsApiError && error.code === 'MODULE_DISABLED';
}

export function isNotFound(error: unknown) {
  return error instanceof CmsApiError && error.status === 404;
}

/** CMS image URLs are server-relative (`/uploads/...`); make them absolute. */
export function cmsAssetUrl(url: string) {
  return new URL(url, cmsOrigin).toString();
}

function buildQuery(params: Record<string, string | number | undefined>) {
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') search.append(key, String(value));
  }

  const query = search.toString();
  return query ? `?${query}` : '';
}

async function cmsGet<T>(
  path: string,
  params: Record<string, string | number | undefined> = {},
): Promise<T> {
  const response = await fetch(`${cmsApiBaseUrl}${path}${buildQuery(params)}`, {
    headers: { Accept: 'application/json' },
  });

  const contentType = response.headers.get('content-type') ?? '';

  if (!contentType.includes('application/json')) {
    throw new CmsApiError(
      `Expected JSON from ${path}, got "${contentType || 'no content-type'}"`,
      response.status,
    );
  }

  const body = (await response.json()) as Record<string, unknown> | null;

  if (!response.ok) {
    throw new CmsApiError(
      typeof body?.message === 'string'
        ? body.message
        : `CMS request failed with status ${response.status}`,
      response.status,
      typeof body?.code === 'string' ? body.code : undefined,
    );
  }

  return body as T;
}

export const newsApi = {
  /** Published articles, newest first. */
  list: (params: NewsQuery = {}) =>
    cmsGet<NewsListResponse>('/api/v1/news', { ...params }),

  article: (id: string) =>
    cmsGet<NewsArticleResponse>('/api/v1/news', { id }),
};
