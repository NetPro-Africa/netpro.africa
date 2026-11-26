import { Link, useParams } from '@tanstack/react-router';
import { ArrowLeftIcon, ChevronRightIcon } from 'lucide-react';
import { useRef } from 'react';

import { useNewsArticle, useNewsList } from '../api/use-news';
import type { NewsArticle } from '../api/news-types';
import { ArticleShare } from '../components/article-share';
import { NewsCard } from '../components/news-card';
import { NewsRichText } from '../components/news-rich-text';
import { NewsState } from '../components/news-state';
import { ReadingProgress } from '../components/reading-progress';
import {
  getNewsCategory,
  getNewsDate,
  getNewsImage,
  getNewsImageAlt,
  getNewsReadTime,
  isArticleId,
  newsErrorCopy,
  NOT_FOUND_COPY,
} from '../lib/news-utils';
import { cn } from '@/lib/utils';
import { isCmsConfigured } from '@/shared/config/cms';
import { absoluteUrl } from '@/shared/config/site';

const READING_COLUMN = 'mx-auto w-full max-w-[42rem]';

const backLinkClass =
  'np-focus inline-flex min-h-11 w-fit items-center gap-2 rounded-full text-base font-medium text-(--np-subtle) transition-colors duration-(--np-duration-fast) hover:text-foreground';

function BackToNews({ className }: { className?: string }) {
  return (
    <Link
      to="/news"
      search={{ page: 1 }}
      className={cn(backLinkClass, 'group', className)}
    >
      <ArrowLeftIcon
        className="size-4 transition-transform duration-(--np-duration-fast) group-hover:-translate-x-0.5 motion-reduce:transition-none"
        aria-hidden="true"
      />
      All news
    </Link>
  );
}

const pulse =
  'animate-pulse rounded bg-white/[0.05] motion-reduce:animate-none';

/** Mirrors the real layout so nothing shifts when the article arrives. */
function ArticleSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading article">
      <div className={cn(READING_COLUMN, 'flex flex-col gap-6')}>
        <div className={cn(pulse, 'h-5 w-40')} />
        <div className="flex flex-col gap-3">
          <div className={cn(pulse, 'h-12 w-full')} />
          <div className={cn(pulse, 'h-12 w-3/4')} />
        </div>
        <div className="flex items-center gap-3 border-y border-white/8 py-5">
          <div className={cn(pulse, 'size-11 rounded-full')} />
          <div className="flex flex-col gap-2">
            <div className={cn(pulse, 'h-4 w-32')} />
            <div className={cn(pulse, 'h-4 w-44')} />
          </div>
        </div>
      </div>
      <div
        className={cn(
          pulse,
          'mx-auto mt-10 aspect-4/3 w-full max-w-5xl sm:aspect-video rounded-(--np-radius-2xl)',
        )}
      />
      <div className={cn(READING_COLUMN, 'mt-12 flex flex-col gap-4')}>
        {['w-full', 'w-full', 'w-5/6', 'w-full', 'w-2/3'].map(
          (width, index) => (
            <div key={index} className={cn(pulse, 'h-5', width)} />
          ),
        )}
      </div>
    </div>
  );
}

/**
 * CMS photos come in any shape. The image is shown whole (never cropped)
 * over a blurred, dimmed copy of itself that fills the frame, so portraits
 * and wide shots both sit well in a 16:9 slot.
 */
function ArticleHero({ article }: { article: NewsArticle }) {
  const image = getNewsImage(article);
  if (!image) return null;

  const alt = getNewsImageAlt(article);
  const caption = article.images[0]?.altText?.trim();

  return (
    <figure className="mx-auto mt-10 w-full max-w-5xl sm:mt-12">
      <div className="relative aspect-4/3 overflow-hidden sm:aspect-video rounded-(--np-radius-2xl) border border-white/8 bg-white/3 shadow-[0_24px_60px_-30px_rgb(0_0_0/0.6)]">
        <img
          src={image}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 size-full scale-110 object-cover opacity-50 blur-2xl"
        />
        <img
          src={image}
          alt={alt}
          className="relative size-full object-contain"
        />
      </div>
      {caption && caption !== article.title ? (
        <figcaption
          className={cn(
            READING_COLUMN,
            'mt-3 text-sm leading-6 text-(--np-subtle)',
          )}
        >
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}

function ArticleView({ article }: { article: NewsArticle }) {
  const articleRef = useRef<HTMLElement>(null);
  const category = getNewsCategory(article);
  const shareUrl = absoluteUrl(`/news/${article._id}`);
  const wasUpdated =
    article.updatedAt &&
    new Date(article.updatedAt).toDateString() !==
      new Date(article.createdAt).toDateString();

  return (
    <>
      <ReadingProgress targetRef={articleRef} />
      <article
        ref={articleRef}
        className="motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-300 motion-safe:ease-out"
      >
        <header className={cn(READING_COLUMN, 'flex flex-col gap-6')}>
          <nav aria-label="Breadcrumb">
            <ol className="flex flex-wrap items-center gap-1.5 text-sm text-(--np-subtle)">
              <li>
                <Link
                  to="/news"
                  search={{ page: 1 }}
                  className="np-focus inline-flex min-h-11 items-center rounded-sm transition-colors duration-(--np-duration-fast) hover:text-foreground"
                >
                  News
                </Link>
              </li>
              <li aria-hidden="true">
                <ChevronRightIcon className="size-3.5" />
              </li>
              <li className="font-medium uppercase tracking-[0.08em] text-primary">
                {category}
              </li>
            </ol>
          </nav>

          <h1 className="font-heading text-[clamp(2.1rem,4.6vw,3.5rem)] font-semibold leading-[1.1] tracking-tight text-balance text-foreground">
            {article.title}
          </h1>

          <div className="flex items-center justify-between gap-4 border-y border-white/8 py-4">
            <div className="flex min-w-0 items-center gap-3">
              <span
                className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground"
                aria-hidden="true"
              >
                NP
              </span>
              <div className="min-w-0">
                <p className="text-base font-medium text-foreground">
                  NetPro Newsroom
                </p>
                <p className="text-sm text-(--np-subtle)">
                  <time dateTime={article.createdAt}>
                    {getNewsDate(article)}
                  </time>
                  <span className="mx-2" aria-hidden="true">
                    ·
                  </span>
                  {getNewsReadTime(article)}
                </p>
              </div>
            </div>
            <ArticleShare
              url={shareUrl}
              title={article.title}
              variant="compact"
            />
          </div>
        </header>

        <ArticleHero article={article} />

        <div className={cn(READING_COLUMN, 'mt-12 sm:mt-14')}>
          <NewsRichText html={article.content} />

          <footer className="mt-14 flex flex-col gap-8 border-t border-white/8 pt-8">
            {wasUpdated ? (
              <p className="text-sm text-(--np-subtle)">
                Updated{' '}
                <time dateTime={article.updatedAt}>
                  {getNewsDate({ ...article, createdAt: article.updatedAt! })}
                </time>
              </p>
            ) : null}
            <div className="flex flex-col gap-4">
              <h2 className="text-base font-semibold text-foreground">Share</h2>
              <ArticleShare url={shareUrl} title={article.title} />
            </div>
            <BackToNews />
          </footer>
        </div>
      </article>
    </>
  );
}

export function NewsArticlePage() {
  const { id } = useParams({ from: '/news/$id' });
  const validId = isArticleId(id);
  const { data, isPending, isError, error, refetch, isRefetching } =
    useNewsArticle(validId ? id : undefined);
  const { data: latest } = useNewsList({ page: 1, limit: 4 });

  const article = data?.news;
  const more = (latest?.news ?? [])
    .filter((item) => item._id !== id)
    .slice(0, 3);

  let body;

  if (!isCmsConfigured || !validId) {
    body = (
      <NewsState
        title={NOT_FOUND_COPY.title}
        detail={NOT_FOUND_COPY.detail}
        action={<BackToNews className="mt-2" />}
      />
    );
  } else if (isPending) {
    body = <ArticleSkeleton />;
  } else if (isError || !article) {
    const copy = error ? newsErrorCopy(error, 'article') : NOT_FOUND_COPY;
    body = (
      <NewsState
        title={copy.title}
        detail={copy.detail}
        onRetry={copy.canRetry ? () => void refetch() : undefined}
        isRetrying={isRefetching}
        action={<BackToNews className="mt-2" />}
      />
    );
  } else {
    body = <ArticleView article={article} />;
  }

  return (
    <div className="bg-background">
      <section className="np-container pt-8 pb-20 sm:pt-12 sm:pb-28">
        {body}
      </section>

      {article && more.length > 0 ? (
        <section
          className="border-t border-white/8 bg-white/1.5"
          aria-labelledby="more-news-heading"
        >
          <div className="np-container flex flex-col gap-10 py-20 sm:py-24">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <h2
                id="more-news-heading"
                className="text-[clamp(1.75rem,3vw,2.25rem)] font-semibold tracking-[-0.02em] text-foreground"
              >
                More from NetPro
              </h2>
              <Link
                to="/news"
                search={{ page: 1 }}
                className="np-focus inline-flex min-h-11 items-center rounded-full text-base font-medium text-primary hover:underline hover:underline-offset-4"
              >
                View all news
              </Link>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {more.map((item, index) => (
                <NewsCard
                  key={item._id}
                  article={item}
                  index={index}
                  showExcerpt={false}
                />
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
