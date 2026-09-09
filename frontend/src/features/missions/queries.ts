import { queryOptions } from '@tanstack/react-query'

import { getWeeklyMissions } from '@/api/missions'

/**
 * What the missions screen reads that nothing else does.
 *
 * The flash mission is the dashboard's query, reused by key rather than duplicated: the two
 * screens show the same card, and a second key would let them disagree about whether it has
 * been accepted.
 */
export const missionQueries = {
  weekly: () =>
    queryOptions({
      queryKey: ['missions', 'weekly'],
      queryFn: getWeeklyMissions,
    }),
}
