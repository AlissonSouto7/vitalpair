import { QueryClient } from '@tanstack/react-query'
import { AxiosError } from 'axios'

/**
 * Retries a failed request, except when retrying cannot help.
 *
 * A 4xx means the request itself was wrong: the same call will fail the same way, and
 * repeating it only delays the error the user needs to see. A 401 in particular is already
 * handled by the axios interceptor, which refreshes the session and replays the request
 * once; retrying here on top of that would multiply the same work.
 */
function retry(failureCount: number, error: unknown): boolean {
  const status = error instanceof AxiosError ? error.response?.status : undefined
  if (status !== undefined && status >= 400 && status < 500) return false
  return failureCount < 2
}

/**
 * The data client for the whole application.
 *
 * Every screen used to fetch in a useEffect and keep the result in useState. That pattern
 * has no cache, so moving between two screens refetched everything; no deduplication, so
 * the dashboard fired seven requests that overlapped; and no way to invalidate, so after
 * logging a meal the page had to refetch by hand or show a stale number.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry,
      // Data is considered current for half a minute. Long enough that moving between
      // screens does not refetch, short enough that a partner's activity shows up
      // without a manual reload.
      staleTime: 30_000,
      // The window regaining focus is a weak signal on a desktop with many tabs, and it
      // costs a request every time. Refetching on reconnect is kept: a device coming back
      // from offline genuinely has stale data.
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      // A mutation is a deliberate action by the user. Repeating it silently could log the
      // same meal twice, so failures surface instead.
      retry: false,
    },
  },
})
