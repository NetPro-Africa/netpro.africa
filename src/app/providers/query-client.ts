import { QueryClient } from '@tanstack/react-query'

/** Shared with the router, so route loaders can fill the same cache the
 * pages read from. */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,
      refetchOnWindowFocus: false,
    },
  },
})
