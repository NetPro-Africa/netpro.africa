import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import { RouterProvider } from '@tanstack/react-router'

import { AppProviders } from '@/app/providers/app-providers'
import { router } from '@/app/router'
import { initializeThemeMode } from '@/shared/stores/ui-store'
import { canReloadForNewVersion, reloadForNewVersion } from '@/shared/lib/stale-build'
import './index.css'

initializeThemeMode()

// Head tags written into the HTML for crawlers (index.html and the build's
// pre-rendered pages). The router renders its own from here on; leaving these
// in would mean two titles, descriptions and canonicals.
document.head
  .querySelectorAll('[data-prerender]')
  .forEach((element) => element.remove())

// A tab opened before a deploy can ask for files that are gone; reload once.
window.addEventListener('vite:preloadError', (event) => {
  if (!canReloadForNewVersion()) return
  event.preventDefault()
  reloadForNewVersion()
})

const container = document.getElementById('root')!
const app = (
  <StrictMode>
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>
  </StrictMode>
)

if (container.hasChildNodes()) {
  // The build rendered this page into the HTML (scripts/prepare-deploy.mjs).
  // Load the route (its code is preloaded) so the first client render matches
  // that HTML, then take it over instead of drawing it again. `ssr` is the
  // flag TanStack's own server rendering sets before hydrating: it renders
  // the routes the same way the build did and skips loading them twice.
  router.ssr = { manifest: undefined }
  void router.load().then(() => hydrateRoot(container, app))
} else {
  createRoot(container).render(app)
}
