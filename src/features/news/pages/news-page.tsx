import { Link, useNavigate, useSearch } from '@tanstack/react-router';
import { ChevronLeftIcon, ChevronRightIcon, NewspaperIcon } from 'lucide-react';

import { useNewsList } from '../api/use-news';
import { NewsCard, NewsCardSkeleton } from '../components/news-card';
import { NewsState } from '../components/news-state';
import { newsErrorCopy } from '../lib/news-utils';
import { isCmsConfigured } from '@/shared/config/cms';
import { cn } from '@/lib/utils';

const PAGE_SIZE = 12;

const pagerButtonClass =
  'np-focus inline-flex min-h-12 items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-5 text-base font-medium text-foreground transition-[background-color,transform] duration-(--np-duration-fast) hover:bg-white/[0.08] active:scale-[0.97]';

export function NewsPage() {
  const { page } = useSearch({ from: '/news' });
  const navigate = useNavigate({ from: '/news' });
  const { data, isPending, isError, error, refetch, isRefetching, isPlaceholderData } =
    useNewsList({ page, limit: PAGE_SIZE });

  const news = data?.news ?? [];
  const totalPages = Math.max(1, Math.ceil((data?.total ?? 0) / PAGE_SIZE));
  const goToPage = (next: number) =>
    void navigate({ search: { page: Math.min(Math.max(next, 1), totalPages) } });

  let content;

  if (!isCmsConfigured) {
    content = (
      <NewsState
        icon={<NewspaperIcon className="size-10" aria-hidden="true" />}
        title="No news yet"
        detail="Announcements and stories from NetPro will appear here soon."
      />
    );
  } else if (isPending) {
    content = (
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true" aria-label="Loading news">
        {Array.from({ length: 6 }, (_, index) => (
          <NewsCardSkeleton key={index} />
        ))}
      </div>
    );
  } else if (isError) {
    const copy = newsErrorCopy(error);
    content = (
      <NewsState
        title={copy.title}
        detail={copy.detail}
        onRetry={copy.canRetry ? () => void refetch() : undefined}
        isRetrying={isRefetching}
      />
    );
  } else if (news.length === 0) {
    content = (
      <NewsState
        icon={<NewspaperIcon className="size-10" aria-hidden="true" />}
        title={page > 1 ? 'No more stories' : 'No news yet'}
        detail={
          page > 1
            ? 'You’ve reached the end of the news.'
            : 'Announcements and stories from NetPro will appear here soon.'
        }
        action={
          page > 1 ? (
            <Link to="/news" search={{ page: 1 }} className={cn(pagerButtonClass, 'mt-2')}>
              Back to latest news
            </Link>
          ) : null
        }
      />
    );
  } else {
    content = (
      <div className="flex flex-col gap-12">
        <div
          className={cn(
            'grid gap-5 transition-opacity duration-(--np-duration-fast) sm:grid-cols-2 lg:grid-cols-3',
            isPlaceholderData && 'opacity-60',
          )}
          aria-busy={isPlaceholderData}
        >
          {news.map((article, index) => (
            <NewsCard key={article._id} article={article} index={index} />
          ))}
        </div>

        {totalPages > 1 ? (
          <nav className="flex items-center justify-center gap-3 sm:gap-5" aria-label="News pages">
            {page > 1 ? (
              <button type="button" className={pagerButtonClass} onClick={() => goToPage(page - 1)}>
                <ChevronLeftIcon className="size-5" aria-hidden="true" />
                Newer
              </button>
            ) : null}
            <span className="text-base text-(--np-subtle)" aria-current="page">
              Page {page} of {totalPages}
            </span>
            {page < totalPages ? (
              <button type="button" className={pagerButtonClass} onClick={() => goToPage(page + 1)}>
                Older
                <ChevronRightIcon className="size-5" aria-hidden="true" />
              </button>
            ) : null}
          </nav>
        ) : null}
      </div>
    );
  }

  return (
    <div className="bg-background">
      <section className="relative overflow-hidden border-b border-white/8">
        <div className="np-container flex min-h-80 items-end pb-14 pt-24 sm:min-h-96 lg:pb-16">
          <div className="max-w-4xl">
            <h1 className="font-heading text-[clamp(2.45rem,5vw,4.7rem)] font-semibold leading-[1.08] tracking-[-0.03em] text-foreground">
              <span className="text-(--np-subtle)">Latest</span> News
            </h1>
            <p className="mt-6 max-w-3xl text-base leading-7 text-muted-foreground sm:text-lg">
              Product launches, partnerships and stories from NetPro and the
              institutions we work with across Africa.
            </p>
          </div>
        </div>
      </section>

      <section className="np-section">
        <div className="np-container">{content}</div>
      </section>
    </div>
  );
}
