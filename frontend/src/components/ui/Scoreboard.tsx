import { useTranslation } from 'react-i18next'

import { Broto } from '../brand/Broto'

import { Avatar } from './Avatar'

/** Avatar do placar: Broto pro você/par, fantasma cinza no modo solo. */
function SideAvatar({ tone, initial }: { tone: 'you' | 'rival' | 'ghost'; initial: string }) {
  if (tone === 'ghost') return <Avatar initial={initial} tone="ghost" size={56} />
  return (
    <Broto
      who={tone === 'you' ? 'you' : 'partner'}
      expr={tone === 'you' ? 'happy' : 'smug'}
      size={66}
    />
  )
}

/**
 * Placar da temporada — a assinatura visual do produto.
 * Você (laranja) vs. par (roxo); a barra é cabo-de-guerra; quem lidera = verde.
 * O fundo (bg-arena) é theme-aware: claro no modo claro, espresso no escuro.
 *
 * Para o modo SOLO, passe rival={{ name:'Semana passada', score, tone:'ghost' }}.
 */
interface Side {
  name: string
  score: number
  initial?: string
  tone?: 'you' | 'rival' | 'ghost'
}

export function Scoreboard({
  you,
  rival,
  stake,
  seasonNumber = 1,
  day = 1,
  total = 30,
  daysLeft,
}: {
  you: Side
  rival: Side
  stake?: string
  seasonNumber?: number
  day?: number
  total?: number
  daysLeft?: number
}) {
  const { t } = useTranslation()
  const sum = you.score + rival.score
  const youPct = sum > 0 ? Math.round((you.score / sum) * 100) : 50
  const leading = you.score - rival.score
  const ghost = rival.tone === 'ghost'
  // The server sends daysLeft; the subtraction is only the fallback for a caller that has
  // not loaded the season yet.
  const remaining = daysLeft ?? Math.max(0, total - day)

  return (
    <div className="relative overflow-hidden rounded-[22px] border border-arena-border bg-arena px-7 py-6 shadow-[0_14px_36px_var(--arena-shadow)]">
      <div
        className="absolute inset-x-0 top-0 h-[3px]"
        style={{
          background: `linear-gradient(90deg, var(--brand) 0 ${youPct}%, ${
            ghost ? '#9a8f7f' : 'var(--rival)'
          } ${youPct}% 100%)`,
        }}
      />
      <div className="mb-[18px] flex items-center justify-between">
        <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-arena-muted">
          {t('dashboard.seasonLabel', {
            n: String(seasonNumber).padStart(2, '0'),
            day,
            total,
          })}
        </div>
        {stake && (
          <div className="flex items-center gap-2 rounded-lg border border-arena-line bg-white/[0.06] px-3 py-[5px]">
            <span className="text-[10px] font-extrabold tracking-[0.1em] text-arena-muted">
              {t('dashboard.atStake')}
            </span>
            <span className="text-xs font-extrabold text-arena-text">{stake}</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-5">
        <div className="flex flex-1 items-center gap-[14px]">
          <SideAvatar tone="you" initial={you.initial ?? 'V'} />
          <div>
            <div className="text-xs font-extrabold tracking-wide text-brand-ink">{you.name}</div>
            <div className="font-display text-[44px] font-semibold leading-[.95] text-arena-text">
              {you.score}
            </div>
          </div>
        </div>
        <div className="font-display text-base font-semibold text-arena-muted">vs</div>
        <div className="flex flex-1 items-center justify-end gap-[14px] text-right">
          <div>
            <div
              className={`text-xs font-extrabold tracking-wide ${ghost ? 'text-arena-muted' : 'text-rival-ink'}`}
            >
              {rival.name}
            </div>
            <div
              className={`font-display text-[44px] font-semibold leading-[.95] ${ghost ? 'text-arena-muted' : 'text-arena-text'}`}
            >
              {rival.score}
            </div>
          </div>
          <SideAvatar tone={rival.tone ?? 'rival'} initial={rival.initial ?? 'C'} />
        </div>
      </div>

      <div className="my-[18px] flex h-[9px] overflow-hidden rounded-md bg-arena-track">
        <div className="bg-brand" style={{ width: `${youPct}%` }} />
        <div className="flex-1" style={{ background: ghost ? '#9a8f7f' : 'var(--rival)' }} />
      </div>

      <div className="flex items-center justify-between">
        {/*
          Three states, not two, and the colour follows the state.

          A tie used to fall into the leading branch, so 25 against 25 announced "você lidera
          por 0 pts" and declared a winner where there was none. In a product that is a
          competition between two people, a draw is its own thing.

          The colour was a fixed text-success-ink, so somebody losing read that they were
          behind in the same green as somebody winning: the line says one thing and the colour
          says the opposite, on what is the emotional scoreboard of the whole screen. Green
          while ahead, amber while behind (it is a gap still to close, not a loss already
          taken) and the neutral ink for a draw. All three measured against both arena
          backgrounds: 5.40 and 7.96 for amber, 5.09 and 8.26 for green, 16.36 and 14.72 for
          the neutral.
        */}
        <span
          className={`text-[13px] font-extrabold ${
            leading > 0 ? 'text-success-ink' : leading < 0 ? 'text-carb-ink' : 'text-arena-text'
          }`}
        >
          {leading > 0
            ? t('dashboard.leadingBy', { n: leading })
            : leading < 0
              ? t('dashboard.behindBy', { n: -leading })
              : t('dashboard.tied')}
        </span>
        <span className="text-xs font-bold text-arena-muted">
          {remaining === 0 ? t('dashboard.lastDay') : t('dashboard.daysLeft', { n: remaining })}
        </span>
      </div>
    </div>
  )
}
