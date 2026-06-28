import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getDashboard } from '../../api/dashboard'
import { getCompetition, getStreaks } from '../../api/gamification'
import { getPair } from '../../api/pair'
import { getActivities } from '../../api/activity'
import { getFeed } from '../../api/feed'
import { getFlashMission, acceptFlashMission } from '../../api/missions'
import { useAuthStore } from '../../store/authStore'
import type { Dashboard } from '../../types/dashboard'
import type { Competition } from '../../types/gamification'
import type { Pair } from '../../types/pair'
import type { FeedItem } from '../../types/feed'
import type { FlashMission } from '../../types/missions'
import { CalorieRing } from '../../components/ui/CalorieRing'
import { Scoreboard } from '../../components/ui/Scoreboard'
import { Avatar } from '../../components/ui/Avatar'
import { EmailVerificationBanner } from '../../components/EmailVerificationBanner'

interface DashData {
  dash: Dashboard
  pair: Pair
  competition: Competition | null
  streak: number
  workouts: number
  feed: FeedItem[]
  mission: FlashMission | null
}

export function DashboardPage() {
  const userId = useAuthStore((s) => s.userId)
  const [data, setData] = useState<DashData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10)
    Promise.all([
      getDashboard(),
      getPair(),
      getCompetition().catch(() => null),
      getStreaks().catch(() => []),
      getActivities(today).catch(() => []),
      getFeed(0, 4).catch(() => null),
      getFlashMission().catch(() => null),
    ])
      .then(([dash, pair, competition, streaks, activities, feedPage, mission]) => {
        const streak = streaks.reduce((max, s) => Math.max(max, s.currentCount), 0)
        const workouts = activities.filter((a) => a.activityType !== 'STEPS').length
        setData({ dash, pair, competition, streak, workouts, feed: feedPage?.content ?? [], mission })
      })
      .catch(() => setError('Não rolou carregar agora. Tenta de novo daqui a pouco.'))
      .finally(() => setLoading(false))
  }, [])

  async function onAcceptMission() {
    try {
      const updated = await acceptFlashMission()
      setData((d) => (d ? { ...d, mission: updated } : d))
    } catch {
      /* silencioso: missão é extra */
    }
  }

  if (loading) return <p className="text-muted">Carregando...</p>
  if (error) return <p className="rounded-xl bg-danger-soft px-4 py-3 text-danger">{error}</p>
  if (!data) return null

  const { dash, pair, competition, streak, workouts, feed, mission } = data
  const me = dash.me
  const meName = pair.members.find((m) => m.userId === userId)?.name ?? ''
  const partner = dash.partner
  const iAmUser1 = pair.members[0]?.userId === userId
  const myScore = competition ? (iAmUser1 ? competition.user1Score : competition.user2Score) : 0
  const partnerScore = competition ? (iAmUser1 ? competition.user2Score : competition.user1Score) : 0
  const { day, total } = seasonWeek(competition?.weekStart)

  return (
    <div className="space-y-6">
      <EmailVerificationBanner />

      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">
            {greeting()}
            {meName ? `, ${meName.split(' ')[0]}` : ''}
          </h1>
          <p className="text-sm font-bold text-muted">{dateLabel(dash.date)}</p>
        </div>
        {streak > 0 && (
          <div className="flex shrink-0 items-center gap-2 rounded-full bg-brand-soft px-4 py-2">
            <FlameIcon className="h-[18px] w-[18px] fill-brand" />
            <span className="text-sm font-extrabold text-brand-ink">{streak}</span>
            <span className="hidden text-xs font-bold text-muted sm:inline">dias seguidos</span>
          </div>
        )}
      </header>

      {me.calorieTarget == null && (
        <Link
          to="/profile"
          className="block rounded-xl bg-brand-soft px-4 py-3 text-sm font-bold text-brand-ink transition hover:brightness-95"
        >
          Bora terminar seu perfil pra liberar suas metas e o placar →
        </Link>
      )}

      {partner ? (
        <Scoreboard
          you={{ name: 'Você', score: myScore }}
          rival={{ name: partner.name, score: partnerScore, tone: 'rival' }}
          stake={pair.pairName ? undefined : 'Quem perder paga o jantar'}
          day={day}
          total={total}
        />
      ) : (
        <div className="space-y-3">
          <Scoreboard
            you={{ name: 'Você', score: myScore }}
            rival={{ name: 'Semana passada', score: 0, tone: 'ghost' }}
            day={day}
            total={total}
          />
          <Link
            to="/pair"
            className="block rounded-xl border border-dashed border-hair bg-surface px-4 py-3 text-center text-sm font-bold text-muted transition hover:border-brand hover:text-brand-ink"
          >
            Ou chama alguém pra competir de verdade →
          </Link>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
        {/* coluna esquerda */}
        <div className="space-y-5">
          <section className="card">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold text-ink">Consumo de hoje</h2>
              {me.remainingCalories != null && (
                <span className="text-sm font-bold text-muted">
                  {me.remainingCalories >= 0 ? (
                    <>
                      faltam <span className="text-success-ink">{me.remainingCalories} kcal</span>
                    </>
                  ) : (
                    `${-me.remainingCalories} kcal acima`
                  )}
                </span>
              )}
            </div>

            <div className="flex flex-col items-center gap-6 sm:flex-row">
              <CalorieRing current={me.consumedCalories} goal={me.calorieTarget ?? 2000} />
              <div className="w-full flex-1 space-y-4">
                <Macro label="Proteína" value={me.consumedProteinG} target={me.proteinTargetG} tone="brand" />
                <Macro label="Carboidrato" value={me.consumedCarbG} target={me.carbTargetG} tone="carb" />
                <Macro label="Gordura" value={me.consumedFatG} target={me.fatTargetG} tone="success" />
              </div>
            </div>

            <Link
              to="/nutrition"
              className="mt-5 flex items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3.5 font-extrabold text-white transition hover:brightness-105"
            >
              <CameraIcon className="h-5 w-5 fill-current" />
              Registrar refeição
            </Link>
          </section>

          <div className="grid grid-cols-3 divide-x divide-hair overflow-hidden rounded-2xl border border-hair bg-surface">
            <StatCell value={me.steps.toLocaleString('pt-BR')} label="passos" />
            <StatCell value={String(workouts)} label={workouts === 1 ? 'treino feito' : 'treinos'} />
            <StatCell value={Math.round(me.burnedCalories).toLocaleString('pt-BR')} label="kcal gastas" success />
          </div>
        </div>

        {/* coluna direita */}
        <div className="space-y-5">
          <MissionCard mission={mission} onAccept={onAcceptMission} />
          <FeedPreview items={feed} userId={userId} />
        </div>
      </div>
    </div>
  )
}

/* ---------- subcomponentes ---------- */

function Macro({
  label,
  value,
  target,
  tone,
}: {
  label: string
  value: number
  target: number | null
  tone: 'brand' | 'carb' | 'success'
}) {
  const pct = target ? Math.min(100, Math.round((value / target) * 100)) : 0
  const bar = tone === 'brand' ? 'bg-brand' : tone === 'carb' ? 'bg-carb' : 'bg-success'
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-sm">
        <span className="font-bold text-ink">{label}</span>
        <span className="font-bold text-muted">
          {Math.round(value)}
          {target != null ? ` / ${target} g` : ' g'}
        </span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-track">
        <div className={`h-full rounded-full ${bar}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function StatCell({ value, label, success }: { value: string; label: string; success?: boolean }) {
  return (
    <div className="px-2 py-4 text-center">
      <div className={`font-display text-2xl font-semibold ${success ? 'text-success-ink' : 'text-ink'}`}>{value}</div>
      <div className="mt-1 text-[11px] font-bold lowercase tracking-wide text-muted">{label}</div>
    </div>
  )
}

function MissionCard({ mission, onAccept }: { mission: FlashMission | null; onAccept: () => void }) {
  if (!mission) {
    return (
      <section className="rounded-2xl border border-dashed border-hair bg-surface px-5 py-6 text-center">
        <p className="text-sm font-semibold text-muted">Nenhuma missão rolando agora. Volta mais tarde.</p>
      </section>
    )
  }
  return (
    <section className="rounded-2xl border-[1.5px] border-brand-soft bg-brand-soft p-5">
      <div className="mb-2 flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.08em] text-brand-ink">
        <BoltIcon className="h-4 w-4 fill-brand" />
        Missão relâmpago
      </div>
      <p className="font-display text-lg font-semibold leading-tight text-ink">{mission.title}</p>
      <p className="mt-1 text-xs font-semibold text-muted">
        Vale +{mission.reward} pts{mission.description ? ` · ${mission.description}` : ''}
      </p>
      {mission.accepted ? (
        <div className="mt-3 flex items-center justify-center gap-2 rounded-xl bg-success-soft px-4 py-3 text-sm font-extrabold text-success-ink">
          <CheckIcon className="h-4 w-4 fill-current" /> Você topou! Agora é cumprir.
        </div>
      ) : (
        <button
          onClick={onAccept}
          className="mt-3 w-full rounded-xl bg-success px-4 py-3 font-extrabold text-white transition hover:brightness-105"
        >
          Topar missão
        </button>
      )}
    </section>
  )
}

function FeedPreview({ items, userId }: { items: FeedItem[]; userId: string | null }) {
  return (
    <section className="card">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-display text-base font-semibold text-ink">O que tá rolando</h2>
        <Link to="/feed" className="text-xs font-extrabold text-brand-ink hover:underline">
          ver tudo
        </Link>
      </div>
      {items.length === 0 ? (
        <p className="text-sm font-semibold text-muted">Ainda não tem nada no feed. Registra algo e dá o pontapé.</p>
      ) : (
        <div className="space-y-3">
          {items.map((it) => (
            <div key={it.id} className="flex items-center gap-3">
              <Avatar initial={initial(it.actorName)} tone={it.userId === userId ? 'you' : 'rival'} size={34} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-bold text-ink">{it.title}</p>
                <p className="text-[11px] font-semibold text-muted">{timeAgo(it.createdAt)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

/* ---------- helpers ---------- */

function greeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Bom dia'
  if (h < 18) return 'Boa tarde'
  return 'Boa noite'
}

function initial(name: string): string {
  return name.trim().charAt(0).toUpperCase() || 'A'
}

function dateLabel(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  const weekday = date.toLocaleDateString('pt-BR', { weekday: 'long' })
  const month = date.toLocaleDateString('pt-BR', { month: 'long' })
  const cap = weekday.charAt(0).toUpperCase() + weekday.slice(1)
  return `${cap} · ${d} de ${month}`
}

/** Sem temporada de 30 dias ainda; usa a semana da competição (real) como base. */
function seasonWeek(weekStart?: string): { day: number; total: number } {
  if (!weekStart) return { day: 1, total: 7 }
  const start = new Date(weekStart).getTime()
  const diff = Math.floor((Date.now() - start) / 86400000) + 1
  return { day: Math.min(Math.max(diff, 1), 7), total: 7 }
}

function timeAgo(iso: string): string {
  const min = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (min < 1) return 'agora'
  if (min < 60) return `há ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `há ${h}h`
  return `há ${Math.floor(h / 24)}d`
}

/* ---------- ícones ---------- */

function FlameIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path d="M12 2c1 3-1.5 4-1.5 7A1.5 1.5 0 0012 10c.8-1.6 2.5-1.4 2.5.5 0 1-.7 1.5-.7 2.5 2-1 3-3 2.7-5.5C19 10 20 12.5 20 15a8 8 0 01-16 0c0-4 3-5.5 4-8 .8 1.6 2.5 2 4 1.5C15 7 13 4 12 2z" />
    </svg>
  )
}

function CameraIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path d="M9 4h6l1.2 2H20a2 2 0 012 2v9a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2h2.8zm3 4.5A4.2 4.2 0 1012 17a4.2 4.2 0 000-8.5z" />
    </svg>
  )
}

function BoltIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path d="M13 2 4.5 13.5h5.5L9 22l8.5-12H12z" />
    </svg>
  )
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z" />
    </svg>
  )
}
