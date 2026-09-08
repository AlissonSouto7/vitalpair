import { queryOptions } from '@tanstack/react-query'

import { getFavorites, getLogs, getSummary, searchFoods } from '@/api/nutrition'

/** Today, as the API expects it. Also the cache key, so the day rolling over is a new key. */
function today(): string {
  return new Date().toISOString().slice(0, 10)
}

/**
 * Everything the nutrition screen reads.
 *
 * The three effects this replaces each had a bug of the same family. The meal list and the
 * summary were fetched together in one Promise.all, so the slower one decided when either
 * appeared and a failure in one blanked both. The search kept its own timer, its own
 * loading flag and its own results array, and a slow response for an abandoned query could
 * still overwrite the results of the current one. Favourites were loaded once and then
 * never again, guarded by a null check that also served as the loading flag, so a failed
 * load left the tab permanently empty with no way to retry.
 */
export const nutritionQueries = {
  logs: () =>
    queryOptions({
      queryKey: ['nutrition', 'logs', today()],
      queryFn: () => getLogs(),
    }),

  summary: () =>
    queryOptions({
      queryKey: ['nutrition', 'summary', today()],
      queryFn: () => getSummary(),
    }),

  /**
   * Open Food Facts, searched by name.
   *
   * The query string is part of the key, so switching back to a term already typed answers
   * from cache and a response arriving late for an abandoned term is stored under its own
   * key rather than overwriting the current results. `enabled` keeps the request from
   * firing on one or two characters, which was the reason for the manual guard before.
   */
  search: (term: string) =>
    queryOptions({
      queryKey: ['nutrition', 'search', term],
      queryFn: () => searchFoods(term),
      enabled: term.trim().length >= 2,
      // A food's macros do not change while someone is typing, and the endpoint is a call
      // to somebody else's service.
      staleTime: 5 * 60_000,
    }),

  /**
   * The foods this person logs often.
   *
   * `enabled` is what replaces the "only when the tab is open" effect: the request is not
   * made until the tab is chosen, and after that the cache answers instantly on every
   * return to it.
   */
  favorites: (enabled: boolean) =>
    queryOptions({
      queryKey: ['nutrition', 'favorites'],
      queryFn: getFavorites,
      enabled,
      staleTime: 60_000,
    }),
}
