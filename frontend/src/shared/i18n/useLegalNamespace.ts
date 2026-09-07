import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'

import { loadLegalNamespace, type Lang } from '@/locales'

/**
 * Loads the legal texts for the current language.
 *
 * They are not in the main bundle, so a page that shows them has to wait for the fetch;
 * rendering first would flash the raw translation keys on screen. Reloads when the
 * language changes, because a visitor switching to English needs the English terms.
 *
 * A query rather than a useEffect with a state flag: the effect version has to guard
 * against the component unmounting mid-fetch and re-runs on every remount, while the query
 * caches per language and only fetches once.
 *
 * @returns whether the texts are ready to render
 */
export function useLegalNamespace(): boolean {
  const { i18n } = useTranslation()
  const language = i18n.language.split('-')[0] as Lang

  const { isSuccess } = useQuery({
    queryKey: ['i18n', 'legal', language],
    queryFn: async () => {
      await loadLegalNamespace(language)
      // A query must resolve to something; the value itself is never read, only isSuccess.
      return language
    },
    // The chunk is on the CDN and the strings do not change between renders.
    staleTime: Infinity,
    gcTime: Infinity,
  })

  return isSuccess
}
