import { useMutation, useQueries, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import { CameraIcon, FlameIcon } from './icons'
import { FeedPreview, Macro, MissionCard } from './parts'
import { dateLabel, greeting } from './text'

import { acceptFlashMission } from '@/api/missions'
import { EmailVerificationBanner } from '@/components/EmailVerificationBanner'
import { CalorieRing } from '@/components/ui/CalorieRing'
import { Card } from '@/components/ui/Card'
import { Scoreboard } from '@/components/ui/Scoreboard'
import { Stat } from '@/components/ui/Stat'
import { dashboardQueries } from '@/features/dashboard/queries'
import { useAuthStore } from '@/store/authStore'

export function DashboardPage() {
  const { t, i18n } = useTranslation()
  const userId = useAuthStore((s) => s.userId)
  const queryClient = useQueryClient()

  // The two required queries decide whether the page can render at all; the other five are
  // enrichment, so their failure leaves the screen usable instead of blanking it.
  const [
    summaryQuery,
    pairQuery,
    competitionQuery,
    streaksQuery,
    activitiesQuery,
    feedQuery,
    missionQuery,
    seasonQuery,
  ] = useQueries({
    queries: [
      dashboardQueries.summary(),
      dashboardQueries.pair(),
      dashboardQueries.competition(),
      dashboardQueries.streaks(),
      dashboardQueries.todaysActivities(),
      dashboardQueries.recentFeed(),
      dashboardQueries.flashMission(),
      dashboardQueries.season(),
    ],
  })

  const acceptMission = useMutation({
    mutationFn: acceptFlashMission,
    // The server owns the mission's state after accepting it, so the cache is refreshed
    // from the response rather than guessed at.
    onSuccess: (updated) =>
      queryClient.setQueryData(dashboardQueries.flashMission().queryKey, updated),
  })

  if (summaryQuery.isPending || pairQuery.isPending) {
    return <p className="text-muted">{t('common.loading')}</p>
  }
  if (summaryQuery.isError || pairQuery.isError || !summaryQuery.data || !pairQuery.data) {
    return (
      <p className="rounded-xl bg-danger-soft px-4 py-3 text-danger">{t('dashboard.loadError')}</p>
    )
  }

  const dash = summaryQuery.data
  const pair = pairQuery.data
  const competition = competitionQuery.data ?? null
  const mission = missionQuery.data ?? null
  const feed = feedQuery.data?.content ?? []
  const streak = (streaksQuery.data ?? []).reduce((max, s) => Math.max(max, s.currentCount), 0)
  const workouts = (activitiesQuery.data ?? []).filter((a) => a.activityType !== 'STEPS').length
  const me = dash.me
  const remaining = me.remainingCalories
  const meName = pair.members.find((m) => m.userId === userId)?.name ?? ''
  const partner = dash.partner
  const iAmUser1 = pair.members[0]?.userId === userId
  const myScore = competition ? (iAmUser1 ? competition.user1Score : competition.user2Score) : 0
  const partnerScore = competition
    ? iAmUser1
      ? competition.user2Score
      : competition.user1Score
    : 0
  // The season is enrichment: if it fails to load, the scoreboard still renders with the
  // component's own defaults rather than taking the page down.
  const season = seasonQuery.data ?? null
  const seasonNumber = season?.number ?? 1
  const day = season?.day ?? 1
  const total = season?.total ?? 30
  const daysLeft = season?.daysLeft ?? total - day

  return (
    <div className="space-y-6">
      <EmailVerificationBanner />

      {/*
        O título responde "o que eu faço agora", que é a pergunta de quem abre o app. Era
        "Bom dia, Fulano": simpático, e sem ajuda nenhuma para decidir. A saudação e a data
        continuam, uma linha abaixo, porque situam sem disputar atenção.
      */}
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">
            {me.mealCount > 0
              ? t('dashboard.headlineSome', { count: me.mealCount })
              : t('dashboard.headlineNone')}
          </h1>
          <p className="text-sm font-bold text-muted">
            {greeting(t)}
            {meName ? `, ${meName.split(' ')[0]}` : ''} · {dateLabel(dash.date, i18n.language)}
          </p>
        </div>
        {streak > 0 && (
          <div className="flex shrink-0 items-center gap-2 rounded-full bg-act-soft px-4 py-2">
            <FlameIcon className="h-[18px] w-[18px] fill-act" />
            <span className="text-sm font-extrabold tabular-nums text-act-ink">{streak}</span>
            <span className="hidden text-xs font-bold text-muted sm:inline">
              {t('dashboard.streakDays', { count: streak })}
            </span>
          </div>
        )}
      </header>

      {me.calorieTarget == null && (
        <Link
          to="/profile"
          className="block rounded-xl bg-brand-soft px-4 py-3 text-sm font-bold text-brand-ink transition hover:brightness-95"
        >
          {t('dashboard.completeProfile')}
        </Link>
      )}

      {partner ? (
        <Scoreboard
          you={{ name: t('dashboard.youLabel'), score: myScore }}
          rival={{ name: partner.name, score: partnerScore, tone: 'rival' }}
          stake={season?.stake ?? (pair.pairName ? undefined : t('dashboard.stakeDefault'))}
          seasonNumber={seasonNumber}
          day={day}
          total={total}
          daysLeft={daysLeft}
        />
      ) : (
        <div className="space-y-3">
          <Scoreboard
            you={{ name: t('dashboard.youLabel'), score: myScore }}
            rival={{ name: t('dashboard.lastWeek'), score: 0, tone: 'ghost' }}
            seasonNumber={seasonNumber}
            day={day}
            total={total}
            daysLeft={daysLeft}
          />
          <Link
            to="/pair"
            className="block rounded-xl border border-dashed border-hair bg-surface px-4 py-3 text-center text-sm font-bold text-muted transition hover:border-brand hover:text-brand-ink"
          >
            {t('dashboard.callSomeone')}
          </Link>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
        {/* coluna esquerda */}
        <div className="space-y-5">
          {/*
            Um número em destaque, e não nove. Era o anel com o consumo, mais três barras de
            macro com valor e alvo cada, tudo no mesmo peso: quem abria o app tinha que
            varrer a seção inteira para descobrir se podia comer.

            O saldo é o número que decide a próxima ação, então é ele que fica grande. Os
            macros continuam logo abaixo, porque quem os procura sabe o que procura.
          */}
          <Card as="section" padding="roomy">
            {/*
              O saldo fica neutro quando há margem e âmbar quando passou da meta. É
              informação, não ação: pintá-lo de laranja o faria disputar com o botão logo
              abaixo, que é justamente o que a separação entre `act` e o resto evita.
            */}
            <div className="flex items-start justify-between gap-4">
              <Stat
                size="hero"
                tone={remaining != null && remaining < 0 ? 'pending' : 'neutral'}
                value={remaining == null ? '—' : Math.abs(remaining).toLocaleString(i18n.language)}
                label={
                  remaining == null
                    ? t('dashboard.todayIntake')
                    : remaining >= 0
                      ? t('dashboard.remainingLabel')
                      : t('dashboard.overLabel')
                }
                hint={`${me.consumedCalories.toLocaleString(i18n.language)} / ${(
                  me.calorieTarget ?? 2000
                ).toLocaleString(i18n.language)} kcal`}
              />
              <CalorieRing current={me.consumedCalories} goal={me.calorieTarget ?? 2000} />
            </div>

            <div className="mt-5 space-y-4">
              <Macro
                label={t('dashboard.protein')}
                value={me.consumedProteinG}
                target={me.proteinTargetG}
                tone="protein"
              />
              <Macro
                label={t('dashboard.carb')}
                value={me.consumedCarbG}
                target={me.carbTargetG}
                tone="carb"
              />
              <Macro
                label={t('dashboard.fat')}
                value={me.consumedFatG}
                target={me.fatTargetG}
                tone="fat"
              />
            </div>

            <Link
              to="/nutrition"
              className="mt-5 flex items-center justify-center gap-2 rounded-xl bg-act px-4 py-3.5 font-extrabold text-on-fill transition hover:brightness-110"
            >
              <CameraIcon className="h-5 w-5 fill-current" />
              {t('dashboard.logMeal')}
            </Link>
          </Card>

          {/*
            Passos, treinos e kcal gastas são quantidade sem juízo de valor, então ficam
            neutros: pintá-los de verde diria que oitocentos passos é "bom", que é uma
            avaliação que o app não tem como fazer.

            Formatados pelo idioma da interface, e não em pt-BR fixo: 8.400 vira 8,400 para
            quem lê em inglês.
          */}
          <Card padding="none">
            <div className="grid grid-cols-3 divide-x divide-hair">
              <div className="px-2 py-4 text-center">
                <Stat value={me.steps.toLocaleString(i18n.language)} label={t('dashboard.steps')} />
              </div>
              <div className="px-2 py-4 text-center">
                <Stat
                  value={workouts}
                  label={workouts === 1 ? t('dashboard.workoutDone') : t('dashboard.workouts')}
                />
              </div>
              <div className="px-2 py-4 text-center">
                <Stat
                  value={Math.round(me.burnedCalories).toLocaleString(i18n.language)}
                  label={t('dashboard.kcalBurned')}
                />
              </div>
            </div>
          </Card>
        </div>

        {/* coluna direita */}
        <div className="space-y-5">
          <MissionCard mission={mission} onAccept={acceptMission.mutate} t={t} />
          <FeedPreview items={feed} userId={userId} t={t} />
        </div>
      </div>
    </div>
  )
}

/* ---------- subcomponentes ---------- */
