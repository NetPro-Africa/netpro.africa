import { Link } from '@tanstack/react-router';
import { ArrowRightIcon, NewspaperIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import type { NewsArticle } from '../api/news-types';
import {
  getNewsCategory,
  getNewsDate,
  getNewsExcerpt,
  getNewsImage,
  getNewsImageAlt,
} from '../lib/news-utils';

type NewsCardProps = {
  article: NewsArticle;
  /** Position in the grid, used to stagger the entrance. */
  index?: number;
  showExcerpt?: boolean;
  className?: string;
};

// Cards arrive after a fetch, so they can't use the page's data-reveal
// observer (it only collects elements present on mount). They fade up on
// their own instead, staggered, and skip motion for reduced-motion users.
const enterClass =
  'motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-3 motion-safe:fill-mode-both motion-safe:duration-300 motion-safe:ease-out';

export function NewsCard({
  article,
  index = 0,
  showExcerpt = true,
  className,
}: NewsCardProps) {
  const image = getNewsImage(article);

  return (
    <Link
      to="/news/$id"
      params={{ id: article._id }}
      className={cn(
        'np-focus group flex h-full flex-col rounded-(--np-radius-xl) border border-white/10 p-3 transition-[border-color,background-color,transform] duration-(--np-duration-fast) hover:border-white/20 hover:bg-white/[0.03] active:scale-[0.99]',
        enterClass,
        className,
      )}
      style={{ animationDelay: `${Math.min(index, 7) * 60}ms` }}
    >
      <div className="np-card-texture relative aspect-video overflow-hidden rounded-(--np-radius-lg) border border-white/8">
        {image ? (
          <img
            src={image}
            alt={getNewsImageAlt(article)}
            loading="lazy"
            className="relative z-10 size-full object-cover transition-transform duration-(--np-duration-med) group-hover:scale-[1.03] motion-reduce:transition-none"
          />
        ) : (
          <div className="relative z-10 flex size-full items-center justify-center text-(--np-subtle)">
            <NewspaperIcon className="size-10" aria-hidden="true" />
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 px-2 pt-5 pb-3">
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-(--np-subtle)">
          <span className="rounded-full border border-white/12 bg-white/[0.04] px-3 py-1 font-medium text-foreground">
            {getNewsCategory(article)}
          </span>
          <time dateTime={article.createdAt}>{getNewsDate(article)}</time>
        </p>
        <h3 className="line-clamp-2 text-xl font-semibold leading-snug tracking-[-0.01em] text-foreground">
          {article.title}
        </h3>
        {showExcerpt ? (
          <p className="line-clamp-3 text-base leading-7 text-muted-foreground">
            {getNewsExcerpt(article)}
          </p>
        ) : null}
        <span className="mt-auto inline-flex items-center gap-2 pt-2 text-base font-medium text-primary">
          Read story
          <ArrowRightIcon
            className="size-4 transition-transform duration-(--np-duration-fast) group-hover:translate-x-1 motion-reduce:transition-none"
            aria-hidden="true"
          />
        </span>
      </div>
    </Link>
  );
}

/** Same footprint as a card, so the grid doesn't jump when data arrives. */
export function NewsCardSkeleton() {
  return (
    <div
      className="flex flex-col rounded-(--np-radius-xl) border border-white/10 p-3"
      aria-hidden="true"
    >
      <div className="aspect-video animate-pulse rounded-(--np-radius-lg) bg-white/[0.05] motion-reduce:animate-none" />
      <div className="flex flex-col gap-3 px-2 pt-5 pb-3">
        <div className="h-7 w-32 animate-pulse rounded-full bg-white/[0.05] motion-reduce:animate-none" />
        <div className="h-6 w-full animate-pulse rounded bg-white/[0.05] motion-reduce:animate-none" />
        <div className="h-6 w-2/3 animate-pulse rounded bg-white/[0.05] motion-reduce:animate-none" />
      </div>
    </div>
  );
}
