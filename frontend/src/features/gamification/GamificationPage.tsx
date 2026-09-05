import { useEffect, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { getBadgeCatalog, getBadges, getStreaks } from '../../api/gamification'
import type { Badge, BadgeCategory, EarnedBadge, Streak } from '../../types/gamification'

/**
 * Conquistas — medalhas e sequências (streaks), dados reais.
 * O placar/temporada vive em /season; missões em /missions.
 */
export function GamificationPage() {
  const { t } = useTranslation()
  const [streaks, setStreaks] = useState<Streak[]>([])
  const [earned, setEarned] = useState<EarnedBadge[]>([])
  const [catalog, setCatalog] = useState<Badge[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([getStreaks(), getBadges(), getBadgeCatalog()])
      .then(([s, b, cat]) => {
        setStreaks(s)
        setEarned(b)
        setCatalog(cat)
      })
      .catch(() => setError(t('gamification.loadError')))
      .finally(() => setLoading(false))
  }, [t])

  if (loading) return <p className="text-muted">{t('common.loading')}</p>
  if (error)
    return <p className="rounded-xl bg-danger-soft px-4 py-3 font-semibold text-danger">{error}</p>

  const earnedCodes = new Set(earned.map((e) => e.badge.code))

  return (
    <div className="space-y-7">
      <header>
        <h1 className="font-display text-[28px] font-semibold tracking-tight text-ink">
          {t('gamification.title')}
        </h1>
        <p className="mt-1 text-sm font-bold text-muted">{t('gamification.subtitle')}</p>
      </header>

      {/* Sequências (streaks) */}
      <section>
        <h2 className="mb-3 font-display text-base font-semibold text-ink">
          {t('gamification.streaks')}
        </h2>
        {streaks.length === 0 ? (
          <EmptyStreaks />
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {streaks.map((s) => (
              <StreakCard key={s.type} streak={s} />
            ))}
          </div>
        )}
      </section>

      {/* Medalhas */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-base font-semibold text-ink">
            {t('gamification.badges')}
          </h2>
          <span className="text-xs font-extrabold text-muted">
            {t('gamification.badgeCount', { earned: earnedCodes.size, total: catalog.length })}
          </span>
        </div>

        {catalog.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-hair bg-surface px-5 py-6 text-center text-sm font-semibold text-muted">
            {t('gamification.badgesEmpty')}
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {catalog.map((badge) => (
              <BadgeTile key={badge.code} badge={badge} unlocked={earnedCodes.has(badge.code)} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

/* ---------- subcomponentes ---------- */

function StreakCard({ streak }: { streak: Streak }) {
  const { t } = useTranslation()
  const alive = streak.currentCount > 0
  return (
    <div
      className={`flex items-center gap-4 rounded-2xl border p-4 ${
        alive ? 'border-brand-soft bg-brand-soft' : 'border-hair bg-surface'
      }`}
    >
      <span
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
          alive ? 'bg-brand' : 'bg-track'
        }`}
      >
        <FlameIcon className={`h-6 w-6 ${alive ? 'fill-white' : 'fill-muted'}`} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-extrabold uppercase tracking-wide text-muted">
          {t(`gamification.streakLabel.${streak.type}`)}
        </p>
        <p className="font-display text-2xl font-semibold leading-tight text-ink">
          {t(streak.currentCount === 1 ? 'gamification.dayOne' : 'gamification.dayOther', {
            n: streak.currentCount,
          })}
        </p>
        <p className="text-[11px] font-bold text-faint">
          {t('gamification.record', { days: streak.longestCount })}
        </p>
      </div>
    </div>
  )
}

function EmptyStreaks() {
  const { t } = useTranslation()
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-dashed border-hair bg-surface px-5 py-5">
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-track">
        <FlameIcon className="h-6 w-6 fill-muted" />
      </span>
      <p className="text-sm font-semibold text-muted">{t('gamification.streaksEmpty')}</p>
    </div>
  )
}

function BadgeTile({ badge, unlocked }: { badge: Badge; unlocked: boolean }) {
  const Icon = CATEGORY_ICON[badge.category] ?? TrophyIcon
  return (
    <div
      className={`rounded-2xl border p-4 transition ${
        unlocked ? 'border-success-soft bg-success-soft' : 'border-hair bg-surface'
      }`}
    >
      <span
        className={`mb-2.5 flex h-11 w-11 items-center justify-center rounded-2xl ${
          unlocked ? 'bg-success' : 'bg-track'
        }`}
      >
        <Icon className={`h-[22px] w-[22px] ${unlocked ? 'fill-white' : 'fill-muted'}`} />
      </span>
      <p className={`text-sm font-extrabold ${unlocked ? 'text-success-ink' : 'text-muted'}`}>
        {badge.name}
      </p>
      <p
        className={`mt-0.5 text-[11.5px] font-semibold ${unlocked ? 'text-ink/70' : 'text-faint'}`}
      >
        {badge.description}
      </p>
    </div>
  )
}

/* ---------- ícones SVG preenchidos ---------- */

function FlameIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className}>
      <path d="M13.5 2c.6 2.5-.4 4.2-1.7 5.7-1.3 1.6-2.8 3-2.8 5.3a4 4 0 008 0c0-1-.3-1.8-.7-2.5.9.6 1.5 1.6 1.7 3A7 7 0 015 14c0-3.8 2.3-5.5 4.2-7.4C10.8 5 12.4 3.6 13.5 2z" />
    </svg>
  )
}

function TrophyIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className}>
      <path d="M7 4h10v2h3v3a4 4 0 01-4 4 5 5 0 01-3 2v2h3v3H8v-3h3v-2a5 5 0 01-3-2 4 4 0 01-4-4V6h3zm0 4H6v1a2 2 0 002 2zm10 0v3a2 2 0 002-2V8z" />
    </svg>
  )
}

function ForkKnifeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className}>
      <path d="M7 2v7a2 2 0 002 2v11h2V11a2 2 0 002-2V2h-1.5v6h-1V2h-1v6h-1V2zm9 0c-1.7 0-3 2-3 5s1.3 4.5 2 4.5V22h2V2z" />
    </svg>
  )
}

function DumbbellIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className}>
      <path d="M3 10.5h2V9a1.5 1.5 0 013 0v6a1.5 1.5 0 01-3 0v-1.5H3zm18 0h-2V9a1.5 1.5 0 00-3 0v6a1.5 1.5 0 003 0v-1.5h2zM7.5 11h9v2h-9z" />
    </svg>
  )
}

function CalendarCheckIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className}>
      <path d="M7 2v2H5a2 2 0 00-2 2v13a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2h-2V2h-2v2H9V2zm12 7v10H5V9zm-8.3 8.5L7 13.8 8.4 12.4l2.3 2.3 4.9-4.9 1.4 1.4z" />
    </svg>
  )
}

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className}>
      <path d="M8 7a3 3 0 116 0 3 3 0 01-6 0zm9 1.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5zM3 19c0-3 2.7-5 8-5s8 2 8 5v1H3zm16.5-1H21v-1c0-2-1-3.4-2.8-4.2 2 .6 3 2 3 4.2v1z" />
    </svg>
  )
}

function ScaleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className}>
      <path d="M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2zm7 3a3 3 0 00-2.8 4H7v2h10v-2h-2.2A3 3 0 0012 6zm0 2a1 1 0 110 2 1 1 0 010-2z" />
    </svg>
  )
}

const CATEGORY_ICON: Record<BadgeCategory, (props: { className?: string }) => ReactNode> = {
  NUTRITION: ForkKnifeIcon,
  WORKOUT: DumbbellIcon,
  CONSISTENCY: CalendarCheckIcon,
  SOCIAL: UsersIcon,
  WEIGHT: ScaleIcon,
}
