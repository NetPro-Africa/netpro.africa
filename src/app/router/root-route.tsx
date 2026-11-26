import { HeadContent, Outlet } from '@tanstack/react-router'
import { useSyncExternalStore } from 'react'

import { AppLayout } from '@/shared/layout/app-layout'

const noop = () => () => {}

/** False in the build-time render and while hydrating it, true after. */
function useHydrated() {
  return useSyncExternalStore(
    noop,
    () => true,
    () => false,
  )
}

export function RootRouteComponent() {
  // The build writes each page's head tags into its HTML (prepare-deploy.mjs),
  // so the router's own head tags are added only once the app has taken over;
  // rendering them in the build's HTML too would duplicate them.
  const hydrated = useHydrated()

  return (
    <>
      {hydrated ? <HeadContent /> : null}
      <AppLayout>
        <Outlet />
      </AppLayout>
    </>
  )
}
