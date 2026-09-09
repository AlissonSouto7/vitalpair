import { queryOptions } from '@tanstack/react-query'

import { getInvitePreview } from '@/api/pair'

/** What the pair screens read. */
export const pairQueries = {
  /**
   * Who is behind an invite code, for the page a link lands on.
   *
   * Not retried: a code that does not exist will not start existing, and the visitor is
   * staring at a blank card while the retries run. The page has a real "invite not found"
   * state, which says more than a spinner that eventually gives up.
   */
  invitePreview: (code: string) =>
    queryOptions({
      queryKey: ['pair', 'invite', code],
      queryFn: () => getInvitePreview(code),
      retry: false,
      enabled: code.length > 0,
    }),
}
