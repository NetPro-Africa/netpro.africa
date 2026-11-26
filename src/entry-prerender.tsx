// Build-time render of one page to HTML, used by scripts/prepare-deploy.mjs
// (through Vite, like src/prerender.ts). The HTML goes inside <div id="root">,
// so the page shows before any JavaScript runs; src/main.tsx then hydrates it.
// Not imported by the app.

import { createMemoryHistory, RouterProvider } from '@tanstack/react-router';
import { StrictMode } from 'react';
import { renderToString } from 'react-dom/server';

import { AppProviders } from '@/app/providers/app-providers';
import { createAppRouter } from '@/app/router';

export async function renderPage(url: string) {
  const router = createAppRouter(createMemoryHistory({ initialEntries: [url] }));
  // Runs loaders and loads the lazy page component, so the page itself is in
  // the HTML rather than its loading state.
  await router.load();
  // Outside the browser the router doesn't load code-split page components;
  // renderToString can't wait for them, so load them first.
  await Promise.all(
    router.state.matches.map((match) => {
      const component = router.routesById[match.routeId]?.options.component as
        | { preload?: () => Promise<void> }
        | undefined;
      return component?.preload?.();
    }),
  );

  // renderToString, not react-dom/static's prerender: prerender moves large
  // finished sections into a <div hidden> that an inline script reveals
  // later, which hid the page until JavaScript ran. Everything is loaded by
  // now, so nothing suspends and the HTML comes out whole.
  const html = renderToString(
    <StrictMode>
      <AppProviders>
        <RouterProvider router={router} />
      </AppProviders>
    </StrictMode>,
  );

  if (html.includes('<!--$!-->') || html.includes('<!--$?-->')) {
    throw new Error(`${url} rendered a loading placeholder instead of the page`);
  }

  // React puts resource hints (e.g. a preload for an <img srcset>) at the
  // start of its output. They belong in <head>: left in <div id="root"> they
  // don't match the browser's first render and hydration fails.
  const hints = html.match(/^(?:<link\b[^>]*>)+/)?.[0] ?? '';
  return { head: hints, body: html.slice(hints.length) };
}
