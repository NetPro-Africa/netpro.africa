// Shapes the NetPro CMS sends for news, as used by the UAES site.

export type CmsImage = {
  url: string;
  filename?: string;
  originalName?: string;
  altText?: string;
  _id?: string;
};

export type NewsArticle = {
  _id: string;
  title: string;
  /** HTML written in the CMS editor. */
  content: string;
  newsTag?: string;
  images: CmsImage[];
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
};

export type NewsQuery = {
  page?: number;
  /** The CMS caps this at 100. */
  limit?: number;
  search?: string;
};

/** Note the `news` key, with `total`/`page` beside it. */
export type NewsListResponse = {
  success: boolean;
  total: number;
  page: number;
  news: NewsArticle[];
};

/** `?id=` answers with a single `{ news }`, not a list. */
export type NewsArticleResponse = {
  success?: boolean;
  news: NewsArticle;
};
