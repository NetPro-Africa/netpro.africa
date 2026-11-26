import { lazyRouteComponent } from '@tanstack/react-router';

// `lazyRouteComponent` (unlike React.lazy) lets the router fetch a page's code
// before it swaps pages, so the current page stays put until the next one is
// ready instead of flashing the layout's footer in an empty <main>.
export const HomePage = lazyRouteComponent(
  () => import('@/features/home/pages/home-page'),
  'HomePage',
);
export const ServicesPage = lazyRouteComponent(
  () => import('@/features/services/pages/services-page'),
  'ServicesPage',
);
export const ProjectsPage = lazyRouteComponent(
  () => import('@/features/projects/pages/projects-page'),
  'ProjectsPage',
);
export const AboutPage = lazyRouteComponent(
  () => import('@/features/about/pages/about-page'),
  'AboutPage',
);
export const ContactPage = lazyRouteComponent(
  () => import('@/features/contact/pages/contact-page'),
  'ContactPage',
);
export const CareersPage = lazyRouteComponent(
  () => import('@/features/careers/pages/careers-page'),
  'CareersPage',
);
export const BlogPage = lazyRouteComponent(
  () => import('@/features/blog/pages/blog-page'),
  'BlogPage',
);
export const NewsPage = lazyRouteComponent(
  () => import('@/features/news/pages/news-page'),
  'NewsPage',
);
export const NewsArticlePage = lazyRouteComponent(
  () => import('@/features/news/pages/news-article-page'),
  'NewsArticlePage',
);

const allPages = [
  HomePage,
  ServicesPage,
  ProjectsPage,
  AboutPage,
  ContactPage,
  NewsPage,
  NewsArticlePage,
  CareersPage,
  BlogPage,
];

/**
 * Once the first page has rendered and the browser is idle, fetch the other
 * pages' code (small, cached) so every later click shows its page instantly,
 * including on touch screens where hover-preload never fires.
 */
export function preloadAllPages() {
  const run = () => allPages.forEach((page) => void page.preload?.());

  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(run, { timeout: 4000 });
  } else {
    setTimeout(run, 2000);
  }
}
