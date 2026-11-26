import { useNewsList } from '@/features/news/api/use-news';
import { NewsCard } from '@/features/news/components/news-card';
import { LandingButton } from '@/features/home/components/landing-button';
import { LandingSectionHeading } from '@/features/home/components/landing-section-heading';

const LANDING_NEWS_COUNT = 4;

export function LatestNewsSection() {
  const { data } = useNewsList({ page: 1, limit: LANDING_NEWS_COUNT });
  const news = data?.news ?? [];

  // The section appears only once there are stories to show. While loading,
  // with no CMS, news switched off, a failed request or nothing published,
  // it takes no space, so the page never grows a placeholder and then
  // collapses. /news explains those states instead.
  if (news.length === 0) {
    return null;
  }

  return (
    <section className="np-section" aria-label="Latest news">
      <div className="np-container flex flex-col gap-10 sm:gap-14">
        <LandingSectionHeading
          eyebrow="Latest"
          title="News"
          description="Announcements, launches and stories from NetPro and the institutions we work with."
          reveal={false}
        />

        {/* Flex, not grid, so fewer than four stories stay centred under
            the centred heading instead of hugging the left edge. */}
        <div className="flex flex-wrap justify-center gap-5">
          {news.map((article, index) => (
            <NewsCard
              key={article._id}
              article={article}
              index={index}
              showExcerpt={false}
              className="w-full sm:w-[calc((100%-1.25rem)/2)] xl:w-[calc((100%-3.75rem)/4)]"
            />
          ))}
        </div>

        <div className="flex justify-center">
          <LandingButton to="/news" variant="quiet" showArrow>
            View all news
          </LandingButton>
        </div>
      </div>
    </section>
  );
}
