import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'

import type { FlashMission as FlashMissionT, WeeklyMission } from '../../types/missions'
import { dashboardQueries } from '../dashboard/queries'

import { DoneRow, FlashMission, MissionCard, PairMissionCard } from './parts'
import { missionQueries } from './queries'

/**
 * Tela de Missões — dados reais.
 *   relâmpago (laranja) = backend de missão relâmpago
 *   semanais (verde)    = progresso calculado dos logs
 *   do par (roxo)       = você + a Célia
 *   concluídas (verde)  = missões batidas
 */
export function MissionsPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const flashQuery = useQuery(dashboardQueries.flashMission())
  const weeklyQuery = useQuery(missionQueries.weekly())

  const flash: FlashMissionT | null = flashQuery.data ?? null
  const weekly: WeeklyMission[] = weeklyQuery.data ?? []

  /** Writes the accepted mission back, so the dashboard's copy of the card agrees. */
  function setFlash(updated: FlashMissionT) {
    queryClient.setQueryData(dashboardQueries.flashMission().queryKey, updated)
  }

  if (flashQuery.isPending || weeklyQuery.isPending)
    return <p className="font-bold text-muted">{t('common.loading')}</p>
  // Each list stands on its own: the flash card failing is no reason to hide the weekly
  // missions, and the empty states below already say when there is nothing to show. That
  // was true before too, since both calls caught their own errors.

  const selfActive = weekly.filter((m) => m.scope === 'SELF' && !m.completed)
  const pair = weekly.filter((m) => m.scope === 'PAIR' && m.partnerName)
  const done = weekly.filter((m) => m.completed)
  const partnerName = pair[0]?.partnerName ?? t('missions.defaultPartner')

  return (
    <div className="space-y-7">
      <header>
        <h1 className="font-display text-[28px] font-semibold tracking-tight text-ink">
          {t('missions.title')}
        </h1>
        <p className="mt-1 text-sm font-bold text-muted">{t('missions.subtitle')}</p>
      </header>

      {flash && <FlashMission mission={flash} onAccept={setFlash} />}

      {selfActive.length > 0 && (
        <section>
          <h2 className="mb-3 font-display text-base font-semibold text-ink">
            {t('missions.sectionThisWeek')}
          </h2>
          <div className="space-y-[10px]">
            {selfActive.map((m) => (
              <MissionCard key={m.code} mission={m} />
            ))}
          </div>
        </section>
      )}

      {pair.length > 0 && (
        <section>
          <h2 className="mb-1 font-display text-base font-semibold text-ink">
            {t('missions.sectionPair', { partner: partnerName })}
          </h2>
          <p className="mb-3 text-[13px] font-semibold text-muted">
            {t('missions.sectionPairHint')}
          </p>
          <div className="space-y-[10px]">
            {pair.map((m) => (
              <PairMissionCard key={m.code} mission={m} />
            ))}
          </div>
        </section>
      )}

      {done.length > 0 && (
        <section>
          <h2 className="mb-3 font-display text-base font-semibold text-ink">
            {t('missions.sectionDone')}
          </h2>
          <div className="space-y-[9px]">
            {done.map((m) => (
              <DoneRow key={m.code} mission={m} />
            ))}
          </div>
        </section>
      )}

      {selfActive.length === 0 && pair.length === 0 && done.length === 0 && (
        <div className="rounded-2xl border border-dashed border-hair bg-surface px-6 py-10 text-center">
          <p className="font-display text-base font-semibold text-ink">
            {t('missions.emptyTitle')}
          </p>
          <p className="mt-1 text-sm font-semibold text-muted">{t('missions.emptyText')}</p>
        </div>
      )}
    </div>
  )
}

/* ============================================================
   Missão relâmpago — laranja, countdown real
   ============================================================ */
