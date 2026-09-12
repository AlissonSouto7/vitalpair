import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'

import { dashboardQueries } from '../dashboard/queries'

import { useAuthStore } from '@/store/authStore'

/**
 * The partner's first name for copy that teases the person about them, or the generic word
 * for a partner while the pair is loading or before there is one. Screens that only mention
 * the partner in passing use this rather than each reading the pair on their own.
 */
export function usePartnerName(): string {
  const { t } = useTranslation()
  const myId = useAuthStore((s) => s.userId)
  const pair = useQuery(dashboardQueries.pair())
  return pair.data?.members.find((m) => m.userId !== myId)?.name ?? t('common.partnerFallback')
}
