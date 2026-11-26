import {
  createRootRoute,
  createRoute,
  createRouter,
  type RouterHistory,
} from '@tanstack/react-router';

import { RootRouteComponent } from '@/app/router/root-route';
import {
  AboutPage,
  BlogPage,
  CareersPage,
  ContactPage,
  HomePage,
  NewsArticlePage,
  NewsPage,
  preloadAllPages,
  ProjectsPage,
  ServicesPage,
} from '@/app/router/lazy-pages';
import { routerBasePath } from '@/shared/config/site';
import {
  NotFoundPage,
  PageLoading,
  RouteErrorPage,
} from '@/shared/pages/system-pages';
import {
  jsonLd,
  organizationJsonLd,
  pageSeo,
  routeHead,
} from '@/shared/config/seo';
import { queryClient } from '@/app/providers/query-client';
import { isNotFound, newsApi } from '@/features/news/api/news-client';
import { newsKeys } from '@/features/news/api/use-news';
import {
  articleFallbackHead,
  articleHead,
} from '@/features/news/lib/news-seo';
import { isArticleId } from '@/features/news/lib/news-utils';
import { isCmsConfigured } from '@/shared/config/cms';

const rootRoute = createRootRoute({
  component: RootRouteComponent,
  head: () => ({
    scripts: [
      {
        type: 'application/ld+json',
        children: jsonLd(organizationJsonLd),
      },
    ],
  }),
});

const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: HomePage,
  head: () => routeHead(pageSeo.home),
});

const servicesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/services',
  component: ServicesPage,
  head: () => routeHead(pageSeo.services),
});

const projectsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/products',
  component: ProjectsPage,
  head: () => routeHead(pageSeo.products),
});

const aboutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/about-us',
  component: AboutPage,
  head: () => routeHead(pageSeo.about),
});

const contactRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/contact-us',
  component: ContactPage,
  head: () => routeHead(pageSeo.contact),
});

const careersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/careers',
  component: CareersPage,
  head: () => routeHead(pageSeo.careers),
});

const blogRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/blog',
  component: BlogPage,
  head: () => routeHead(pageSeo.blog),
});

const newsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/news',
  component: NewsPage,
  // ?page= keeps the reader's place when they go back from an article.
  validateSearch: (search: Record<string, unknown>): { page: number } => {
    const page = Number(search.page);
    return { page: Number.isInteger(page) && page > 0 ? page : 1 };
  },
  head: () => routeHead(pageSeo.news),
});

const newsArticleRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/news/$id',
  component: NewsArticlePage,
  // Loads the article into the page's query cache (on hover too, through
  // preload) so head() can give it its own title, canonical, social card and
  // JSON-LD. Never throws: the page shows its own loading and error states.
  loader: async ({ params: { id } }) => {
    if (!isCmsConfigured || !isArticleId(id)) {
      return { article: null, notFound: true };
    }

    const queryKey = newsKeys.article(id);

    try {
      const { news } = await queryClient.ensureQueryData({
        queryKey,
        queryFn: () => newsApi.article(id),
      });
      return { article: news, notFound: false };
    } catch (error) {
      // Let the page fetch afresh and show its own error, not a cached one.
      queryClient.removeQueries({ queryKey, exact: true });
      return { article: null, notFound: isNotFound(error) };
    }
  },
  head: ({ params, loaderData }) =>
    loaderData?.article
      ? articleHead(loaderData.article)
      : articleFallbackHead(params.id, loaderData?.notFound ?? false),
});

const routeTree = rootRoute.addChildren([
  homeRoute,
  servicesRoute,
  projectsRoute,
  aboutRoute,
  contactRoute,
  careersRoute,
  blogRoute,
  newsRoute,
  newsArticleRoute,
]);

/** `history` is a memory history when the build renders a page to HTML
 * (src/entry-prerender.tsx); the browser uses its own. */
export function createAppRouter(history?: RouterHistory) {
  return createRouter({
    routeTree,
    history,
    defaultPreload: 'intent',
    defaultNotFoundComponent: NotFoundPage,
    defaultErrorComponent: RouteErrorPage,
    defaultPendingComponent: PageLoading,
    basepath: routerBasePath,
  });
}

export const router = createAppRouter();

if (typeof window !== 'undefined') preloadAllPages();

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
