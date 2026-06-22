import { useEffect, useState } from 'react'
import { getBadgeCatalog, getBadges, getCompetition, getStreaks } from '../../api/gamification'
import { getPair } from '../../api/pair'
import { useAuthStore } from '../../store/authStore'
import type { Badge, Competition, EarnedBadge, Streak, StreakType } from '../../types/gamification'
import type { Pair } from '../../types/pair'

const STREAK_LABEL: Record<StreakType, string> = {
  NUTRITION_LOG: 'Alimentação',
  ACTIVITY: 'Atividade',
}

export function GamificationPage() {
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
      .catch(() => setError('Não foi possível carregar a gamificação.'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p className="text-slate-500">Carregando...</p>
  if (error) return <p className="rounded-lg bg-red-50 px-3 py-2 text-red-700">{error}</p>

  const earnedCodes = new Set(earned.map((e) => e.badge.code))
  const score = resolveScore(competition, pair, userId)

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-slate-800">Conquistas</h1>

      {/* Placar semanal */}
      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold text-slate-700">Placar da semana</h2>
        {score.hasPartner ? (
          <div className="flex items-center justify-around text-center">
            <ScoreSide label="Você" value={score.mine} highlight={score.mine >= score.partner} />
            <span className="text-slate-300">×</span>
            <ScoreSide label={score.partnerName} value={score.partner} highlight={score.partner > score.mine} />
          </div>
        ) : (
          <p className="text-sm text-slate-500">
            Seus pontos: <span className="font-bold text-blue-700">{score.mine}</span>. Forme um par para competir.
          </p>
        )}
      </section>

      {/* Streaks */}
      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold text-slate-700">Sequências</h2>
        {streaks.length === 0 ? (
          <p className="text-sm text-slate-400">Registre refeições e atividades para iniciar suas sequências.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {streaks.map((s) => (
              <div key={s.type} className="rounded-lg bg-slate-50 p-3">
                <p className="text-xs text-slate-500">{STREAK_LABEL[s.type]}</p>
                <p className="text-lg font-bold text-orange-600">🔥 {s.currentCount} dia(s)</p>
                <p className="text-xs text-slate-400">recorde: {s.longestCount}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Badges */}
      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="mb-3 text-sm font-semibold text-slate-700">
          Badges ({earnedCodes.size}/{catalog.length})
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {catalog.map((badge) => {
            const unlocked = earnedCodes.has(badge.code)
            return (
              <div
                key={badge.code}
                className={`rounded-lg border p-3 ${
                  unlocked ? 'border-amber-300 bg-amber-50' : 'border-slate-200 bg-slate-50 opacity-60'
                }`}
              >
                <p className={`text-sm font-semibold ${unlocked ? 'text-amber-800' : 'text-slate-500'}`}>
                  {unlocked ? '🏅 ' : '🔒 '}
                  {badge.name}
                </p>
                <p className="mt-1 text-xs text-slate-500">{badge.description}</p>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}

interface ResolvedScore {
  mine: number
  partner: number
  partnerName: string
  hasPartner: boolean
}

function resolveScore(competition: Competition | null, pair: Pair | null, userId: string | null): ResolvedScore {
  if (!competition || !pair) {
    return { mine: 0, partner: 0, partnerName: 'Parceiro', hasPartner: false }
  }
  const members = pair.members
  const hasPartner = members.length >= 2
  // members[0] corresponde a user1Score; members[1] a user2Score (ordem do backend).
  const iAmFirst = members[0]?.userId === userId
  const mine = iAmFirst ? competition.user1Score : competition.user2Score
  const partner = iAmFirst ? competition.user2Score : competition.user1Score
  const partnerName = (iAmFirst ? members[1]?.name : members[0]?.name) ?? 'Parceiro'
  return { mine, partner, partnerName, hasPartner }
}

function ScoreSide({ label, value, highlight }: { label: string; value: number; highlight: boolean }) {
  return (
    <div>
      <p className={`text-3xl font-bold ${highlight ? 'text-emerald-600' : 'text-slate-400'}`}>{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  )
}
