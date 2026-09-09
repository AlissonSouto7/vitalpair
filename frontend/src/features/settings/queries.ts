import { queryOptions } from '@tanstack/react-query'

import { getNotificationPrefs } from '@/api/notifications'

/** What the settings screen reads that nothing else does. */
export const settingsQueries = {
  /**
   * The notification switches.
   *
   * A failure here is not worth a banner: the screen shows the defaults and the person can
   * still change them, which is what the effect this replaced did by swallowing its error.
   */
  notificationPrefs: () =>
    queryOptions({
      queryKey: ['notifications', 'prefs'],
      queryFn: getNotificationPrefs,
    }),
}
