import {
  createRootRoute,
  createRoute,
  createRouter,
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
  ProjectsPage,
  ServicesPage,
} from '@/app/router/lazy-pages';
import { routerBasePath } from '@/shared/config/site';
import { organizationJsonLd, pageSeo, routeHead } from '@/shared/config/seo';

const rootRoute = createRootRoute({
  component: RootRouteComponent,
  head: () => ({
    scripts: [
      {
        type: 'application/ld+json',
        children: JSON.stringify(organizationJsonLd),
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
  head: () => routeHead(pageSeo.news),
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

export const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
  basepath: routerBasePath,
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
