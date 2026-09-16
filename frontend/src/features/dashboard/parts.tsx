import { Link } from 'react-router-dom'

import { BoltIcon, CheckIcon } from './icons'
import { initial, timeAgo, type TFn } from './text'

import { Avatar } from '@/components/ui/Avatar'
import { MACRO_TONES, type MacroTone } from '@/components/ui/macroTone'
import { flashCopy } from '@/features/missions/missionCopy'
import type { FeedItem } from '@/types/feed'
import type { FlashMission } from '@/types/missions'

/**
 * The pieces the dashboard is assembled from.
 *
 * Moved out of DashboardPage verbatim, markup untouched. They carry no state and no data
 * fetching, which makes them the part that can leave without changing how anything behaves.
 */

export function Macro({
  label,
  value,
  target,
  tone,
}: {
  label: string
  value: number
  target: number | null
  tone: MacroTone
}) {
  const pct = target ? Math.min(100, Math.round((value / target) * 100)) : 0
  const bar = MACRO_TONES[tone].bg
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

export function MissionCard({
  mission,
  onAccept,
  t,
}: {
  mission: FlashMission | null
  onAccept: () => void
  t: TFn
}) {
  if (!mission) {
    return (
      <section className="rounded-2xl border border-dashed border-hair bg-surface px-5 py-6 text-center">
        <p className="text-sm font-semibold text-muted">{t('dashboard.noMission')}</p>
      </section>
    )
  }
  const { title, description } = flashCopy(mission, t)
  return (
    <section className="rounded-xl border-[1.5px] border-act-soft bg-act-soft p-5">
      <div className="mb-2 flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.08em] text-act-ink">
        <BoltIcon className="h-4 w-4 fill-act" />
        {t('dashboard.flashMission')}
      </div>
      <p className="font-display text-lg font-semibold leading-tight text-ink">{title}</p>
      <p className="mt-1 text-xs font-semibold text-muted">
        {description
          ? t('dashboard.missionRewardWithDesc', {
              reward: mission.reward,
              desc: description,
            })
          : t('dashboard.missionReward', { reward: mission.reward })}
      </p>
      {mission.accepted ? (
        /*
          Leva às Missões em vez de ser um aviso morto. Topar é reversível, e o botão de
          desistir vive lá: sem este caminho, quem clicou por engano não tinha para onde ir.
        */
        <Link
          to="/missions"
          className="mt-3 flex items-center justify-center gap-2 rounded-xl bg-success-soft px-4 py-3 text-sm font-extrabold text-success-ink transition hover:brightness-95"
        >
          <CheckIcon className="h-4 w-4 fill-current" /> {t('dashboard.missionAccepted')}
        </Link>
      ) : (
        /*
          Secundário, e não verde sólido. Era um botão cheio ao lado do "Registrar
          refeição", que é a ação da tela: duas chamadas do mesmo peso em cores diferentes,
          e quem abre o app tinha que escolher entre as duas. Verde também estava errado
          aqui, porque significa concluído, e topar a missão é o começo dela.
        */
        <button
          onClick={onAccept}
          className="mt-3 w-full rounded-xl bg-surface px-4 py-3 font-extrabold text-act-ink transition hover:brightness-95"
        >
          {t('dashboard.acceptMission')}
        </button>
      )}
    </section>
  )
}

export function FeedPreview({
  items,
  userId,
  t,
}: {
  items: FeedItem[]
  userId: string | null
  t: TFn
}) {
  return (
    <section className="card">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-display text-base font-semibold text-ink">
          {t('dashboard.whatsHappening')}
        </h2>
        <Link to="/feed" className="text-xs font-extrabold text-brand-ink hover:underline">
          {t('dashboard.seeAll')}
        </Link>
      </div>
      {items.length === 0 ? (
        <p className="text-sm font-semibold text-muted">{t('dashboard.feedEmpty')}</p>
      ) : (
        <div className="space-y-3">
          {items.map((it) => (
            <div key={it.id} className="flex items-center gap-3">
              <Avatar
                initial={initial(it.actorName)}
                tone={it.userId === userId ? 'you' : 'rival'}
                size={34}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-bold text-ink">{it.title}</p>
                <p className="text-[11px] font-semibold text-muted">{timeAgo(it.createdAt, t)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

/* ---------- helpers ---------- */
