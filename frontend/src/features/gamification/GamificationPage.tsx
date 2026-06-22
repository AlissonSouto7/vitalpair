import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { getBadgeCatalog, getBadges, getCompetition, getStreaks } from '../../api/gamification'
import { getPair } from '../../api/pair'
import { useAuthStore } from '../../store/authStore'
import type { Badge, Competition, EarnedBadge, Streak } from '../../types/gamification'
import type { Pair } from '../../types/pair'

export function GamificationPage() {
  const { t } = useTranslation()
  const userId = useAuthStore((s) => s.userId)
  const [streaks, setStreaks] = useState<Streak[]>([])
  const [competition, setCompetition] = useState<Competition | null>(null)
  const [earned, setEarned] = useState<EarnedBadge[]>([])
  const [catalog, setCatalog] = useState<Badge[]>([])
  const [pair, setPair] = useState<Pair | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([getStreaks(), getCompetition(), getBadges(), getBadgeCatalog(), getPair()])
      .then(([s, c, b, cat, p]) => {
        setStreaks(s)
        setCompetition(c)
        setEarned(b)
        setCatalog(cat)
        setPair(p)
      })
      .catch(() => setError(t('gamification.loadError')))
      .finally(() => setLoading(false))
  }, [t])

  if (loading) return <p className="text-muted">{t('common.loading')}</p>
  if (error) return <p className="rounded-lg bg-red-500/10 px-3 py-2 text-red-500">{error}</p>

  const earnedCodes = new Set(earned.map((e) => e.badge.code))
  const score = resolveScore(competition, pair, userId, t('gamification.partner'))

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-extrabold">{t('gamification.title')}</h1>

      {/* Placar */}
      <div className="card glow-cyan">
        <h2 className="mb-4 text-center text-xs uppercase tracking-widest text-faint">{t('gamification.weekScore')}</h2>
        {score.hasPartner ? (
          <div className="flex items-center justify-around text-center">
            <Side name={t('gamification.you')} value={score.mine} leading={score.mine >= score.partner} />
            <span className="text-2xl font-black text-faint">×</span>
            <Side name={score.partnerName} value={score.partner} leading={score.partner > score.mine} />
          </div>
        ) : (
          <p className="text-center text-sm text-muted">
            {t('gamification.yourPoints')} <span className="text-2xl font-extrabold text-accent">{score.mine}</span>
            <br />
            <span className="text-faint">{t('gamification.formPair')}</span>
          </p>
        )}
      </div>

      {/* Streaks */}
      <div className="card">
        <h2 className="mb-3 text-sm font-semibold text-ink">{t('gamification.streaks')}</h2>
        {streaks.length === 0 ? (
          <p className="text-sm text-faint">{t('gamification.streaksEmpty')}</p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {streaks.map((s) => (
              <div key={s.type} className="rounded-xl border border-line bg-surface2/40 p-3">
                <p className="text-xs text-faint">{t(`gamification.streakLabel.${s.type}`)}</p>
                <p className="text-2xl font-extrabold text-orange-400">🔥 {s.currentCount}</p>
                <p className="text-xs text-faint">{t('gamification.record', { days: s.longestCount })}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Badges */}
      <div className="card">
        <h2 className="mb-3 text-sm font-semibold text-ink">
          {t('gamification.badges')} <span className="text-faint">({earnedCodes.size}/{catalog.length})</span>
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {catalog.map((badge) => {
            const unlocked = earnedCodes.has(badge.code)
            return (
              <div
                key={badge.code}
                className={`rounded-xl border p-3 transition ${
                  unlocked
                    ? 'border-lime-400/40 bg-lime-400/10'
                    : 'border-line bg-surface2/30 opacity-50'
                }`}
              >
                <p className={`text-sm font-semibold ${unlocked ? 'text-accent' : 'text-muted'}`}>
                  {unlocked ? '🏅 ' : '🔒 '}
                  {badge.name}
                </p>
                <p className="mt-1 text-xs text-faint">{badge.description}</p>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

interface ResolvedScore {
  mine: number
  partner: number
  partnerName: string
  hasPartner: boolean
}

function resolveScore(
  competition: Competition | null,
  pair: Pair | null,
  userId: string | null,
  partnerFallback: string,
): ResolvedScore {
  if (!competition || !pair) return { mine: 0, partner: 0, partnerName: partnerFallback, hasPartner: false }
  const members = pair.members
  const hasPartner = members.length >= 2
  const iAmFirst = members[0]?.userId === userId
  const mine = iAmFirst ? competition.user1Score : competition.user2Score
  const partner = iAmFirst ? competition.user2Score : competition.user1Score
  const partnerName = (iAmFirst ? members[1]?.name : members[0]?.name) ?? partnerFallback
  return { mine, partner, partnerName, hasPartner }
}

function Side({ name, value, leading }: { name: string; value: number; leading: boolean }) {
  const { t } = useTranslation()
  return (
    <div>
      <p className={`text-4xl font-black ${leading ? 'text-accent' : 'text-faint'}`}>{value}</p>
      <p className="mt-1 text-xs text-muted">{name}</p>
      {leading && <p className="text-[10px] font-semibold uppercase tracking-wide text-accent">{t('gamification.leading')}</p>}
    </div>
  )
}
