import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from '@tanstack/react-router'

import { AppProviders } from '@/app/providers/app-providers'
import { router } from '@/app/router'
import { initializeThemeMode } from '@/shared/stores/ui-store'
import { canReloadForNewVersion, reloadForNewVersion } from '@/shared/lib/stale-build'
import './index.css'

initializeThemeMode()

// A tab opened before a deploy can ask for files that are gone; reload once.
window.addEventListener('vite:preloadError', (event) => {
  if (!canReloadForNewVersion()) return
  event.preventDefault()
  reloadForNewVersion()
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>
  </StrictMode>,
)
