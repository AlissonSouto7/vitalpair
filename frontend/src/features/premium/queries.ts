import { queryOptions } from '@tanstack/react-query'

import { getMyEntitlement } from '@/api/entitlement'

/** What the paid-feature screens read before deciding what to show. */
export const premiumQueries = {
  /**
   * The caller's plan and whether the AI features are open to them.
   *
   * Cached for a few minutes: it changes when someone pays or when the pair forms or ends,
   * and the screens that do those things invalidate it. Refetching it on every visit to a
   * plan screen would be a request for an answer that is almost always the same.
   */
  entitlement: () =>
    queryOptions({
      queryKey: ['entitlement'],
      queryFn: getMyEntitlement,
      staleTime: 5 * 60 * 1000,
    }),
}
