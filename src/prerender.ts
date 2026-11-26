// Entry point for scripts/prepare-deploy.mjs, loaded through Vite after the
// build so the same SEO code (aliases, env and all) writes the static HTML
// that the app later takes over. Not imported by the app.

export {
  jsonLd,
  organizationJsonLd,
  pageSeo,
  routeHead,
} from '@/shared/config/seo';
export { absoluteUrl, appBasePath, withBasePath } from '@/shared/config/site';
export { cmsOrigin } from '@/shared/config/cms';
export { articleHead, articlePath } from '@/features/news/lib/news-seo';
export { isArticleId } from '@/features/news/lib/news-utils';
export { heroImage } from '@/shared/lib/responsive-image';
