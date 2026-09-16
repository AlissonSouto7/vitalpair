import { useTranslation } from 'react-i18next'

import { Avatar } from './Avatar'

/**
 * O rosto de cada lado do placar.
 *
 * Era o mascote, em laranja de um lado e roxo do outro: a paleta anterior ao Arena, em que
 * laranja identificava você. Hoje laranja é a ação e não identifica ninguém, e as duas
 * pessoas são azul e bordô. O mascote continua sendo a marca (BrandMark), mas aqui o que se
 * pergunta é "quem é quem", e isso é trabalho do Avatar: ele carrega o anel na cor da pessoa
 * e o canto recortado no par, que é o que sobrevive a uma foto de perfil por cima e ao
 * preto e branco.
 */
function SideAvatar({
  tone,
  initial,
  art,
}: {
  tone: 'you' | 'rival' | 'ghost'
  initial: string
  art?: string | null
}) {
  return <Avatar initial={initial} tone={tone} size={56} art={art} />
}

/**
 * A letra do quadrado, tirada do nome de quem ele representa.
 *
 * O padrão era 'V' e 'C', letras fixas que não eram a inicial de ninguém: no placar da dupla
 * Alisson & Bel apareciam um "V" e um "C". Derivar do nome resolve sem que cada tela precise
 * lembrar de passar a inicial.
 */
function initialOf(side: Side): string {
  return (side.initial ?? side.name.trim().charAt(0) ?? '?').toUpperCase()
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
  /**
   * A foto de perfil, já resolvida em URL. Sem ela o quadrado mostra a inicial.
   *
   * O placar era o único lugar que ignorava a foto: quem trocava a sua via o rosto aparecer
   * na tela da dupla e continuar sendo uma letra aqui, que é a tela onde a pessoa mais olha.
   * O anel e o canto recortado seguem separando os dois com a foto por cima, que é a razão
   * de eles existirem.
   */
  art?: string | null
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
  /*
    Cabo de guerra só existe quando há força dos dois lados.

    Com 0 a 0 a barra caía em 50/50, e uma barra dividida ao meio não lê como empate: lê
    como "50% concluído", que é o que uma barra preenchida significa em qualquer outra tela
    do app. Pior no primeiro dia da temporada, que é quando todo mundo está em zero e é
    justamente quando a tela precisa dizer "ninguém pontuou ainda", não inventar uma
    disputa.

    Em zero a barra não tem lado nenhum: fica a trilha vazia, e o texto embaixo é quem
    conta o estado. Só a partir do primeiro ponto ela vira a divisão do placar.
  */
  const started = sum > 0
  const youPct = started ? Math.round((you.score / sum) * 100) : 0
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
          background: started
            ? `linear-gradient(90deg, var(--you) 0 ${youPct}%, ${
                ghost ? 'var(--faint)' : 'var(--pair)'
              } ${youPct}% 100%)`
            : 'var(--arena-line)',
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
          <SideAvatar tone="you" initial={initialOf(you)} art={you.art} />
          <div>
            <div className="text-xs font-extrabold tracking-wide text-you-ink">{you.name}</div>
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
          <SideAvatar tone={rival.tone ?? 'rival'} initial={initialOf(rival)} art={rival.art} />
        </div>
      </div>

      <div
        className="my-[18px] flex h-[9px] overflow-hidden rounded-md bg-arena-track"
        role="img"
        aria-label={
          started
            ? t('dashboard.barSplit', { you: youPct, pair: 100 - youPct })
            : t('dashboard.barEmpty')
        }
      >
        {started && (
          <>
            {/*
              `vp-live`: um brilho atravessa cada lado a cada 3,6s, e o do par sai com meio
              ciclo de atraso, então os dois se revezam. A barra é o placar, e um placar
              parado não conta que a outra pessoa também está jogando. Some inteiro com
              "reduzir movimento" ligado no sistema.
            */}
            <div
              className="vp-live bg-you transition-[width] duration-500"
              style={{ width: `${youPct}%` }}
            />
            <div
              className={`flex-1 ${ghost ? '' : 'vp-live vp-delay'}`}
              style={{ background: ghost ? 'var(--faint)' : 'var(--pair)' }}
            />
          </>
        )}
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
