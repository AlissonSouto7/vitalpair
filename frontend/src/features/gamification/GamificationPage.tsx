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

  if (loading) return <p className="text-slate-400">Carregando...</p>
  if (error) return <p className="rounded-lg bg-red-500/10 px-3 py-2 text-red-400">{error}</p>

  const earnedCodes = new Set(earned.map((e) => e.badge.code))
  const score = resolveScore(competition, pair, userId)

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-extrabold">Conquistas</h1>

      {/* Placar */}
      <div className="card glow-cyan">
        <h2 className="mb-4 text-center text-xs uppercase tracking-widest text-slate-500">Placar da semana</h2>
        {score.hasPartner ? (
          <div className="flex items-center justify-around text-center">
            <Side name="Você" value={score.mine} leading={score.mine >= score.partner} />
            <span className="text-2xl font-black text-slate-600">×</span>
            <Side name={score.partnerName} value={score.partner} leading={score.partner > score.mine} />
          </div>
        ) : (
          <p className="text-center text-sm text-slate-400">
            Seus pontos: <span className="text-2xl font-extrabold text-lime-400">{score.mine}</span>
            <br />
            <span className="text-slate-500">Forme um par para competir.</span>
          </p>
        )}
      </div>

      {/* Streaks */}
      <div className="card">
        <h2 className="mb-3 text-sm font-semibold text-slate-300">Sequências</h2>
        {streaks.length === 0 ? (
          <p className="text-sm text-slate-500">Registre refeições e atividades para iniciar suas sequências.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {streaks.map((s) => (
              <div key={s.type} className="rounded-xl border border-slate-800 bg-slate-800/40 p-3">
                <p className="text-xs text-slate-500">{STREAK_LABEL[s.type]}</p>
                <p className="text-2xl font-extrabold text-orange-400">🔥 {s.currentCount}</p>
                <p className="text-xs text-slate-500">recorde: {s.longestCount} dias</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Badges */}
      <div className="card">
        <h2 className="mb-3 text-sm font-semibold text-slate-300">
          Badges <span className="text-slate-500">({earnedCodes.size}/{catalog.length})</span>
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
                    : 'border-slate-800 bg-slate-800/30 opacity-50'
                }`}
              >
                <p className={`text-sm font-semibold ${unlocked ? 'text-lime-300' : 'text-slate-400'}`}>
                  {unlocked ? '🏅 ' : '🔒 '}
                  {badge.name}
                </p>
                <p className="mt-1 text-xs text-slate-500">{badge.description}</p>
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

function resolveScore(competition: Competition | null, pair: Pair | null, userId: string | null): ResolvedScore {
  if (!competition || !pair) return { mine: 0, partner: 0, partnerName: 'Parceiro', hasPartner: false }
  const members = pair.members
  const hasPartner = members.length >= 2
  const iAmFirst = members[0]?.userId === userId
  const mine = iAmFirst ? competition.user1Score : competition.user2Score
  const partner = iAmFirst ? competition.user2Score : competition.user1Score
  const partnerName = (iAmFirst ? members[1]?.name : members[0]?.name) ?? 'Parceiro'
  return { mine, partner, partnerName, hasPartner }
}

function Side({ name, value, leading }: { name: string; value: number; leading: boolean }) {
  return (
    <div>
      <p className={`text-4xl font-black ${leading ? 'text-lime-400' : 'text-slate-500'}`}>{value}</p>
      <p className="mt-1 text-xs text-slate-400">{name}</p>
      {leading && <p className="text-[10px] font-semibold uppercase tracking-wide text-lime-500">liderando</p>}
    </div>
  )
}
