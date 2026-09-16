import { useEffect, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import { Avatar } from '@/components/ui/Avatar'

/**
 * The sections the landing page stacks, in the order a visitor scrolls through them.
 *
 * Moved out of LandingPage verbatim, markup untouched. All static: the copy comes from i18n
 * and nothing here holds state or fetches.
 */

/**
 * O cartão do placar, ao lado da promessa.
 *
 * A landing dizia que o produto é uma disputa de 30 dias e mostrava três círculos genéricos,
 * então quem chegava tinha de acreditar na descrição. Aqui o placar aparece funcionando: os
 * dois nomes, os dois números, a barra dividida na proporção real e a última coisa que
 * aconteceu. É a mesma lei de cor do app, e é de propósito: quem entra depois reconhece a
 * tela que já viu aqui.
 *
 * Números fixos, e ninguém finge que são de alguém: "BIA" é uma demonstração, como o prato
 * de plástico na vitrine. Não há dado real a buscar, porque não há sessão nesta página.
 */
/**
 * O placar da vitrine, se movendo.
 *
 * A landing dizia que o produto é uma disputa de 30 dias e mostrava três círculos genéricos,
 * então quem chegava tinha de acreditar na descrição. Aqui o placar joga: cada evento soma
 * pontos ao lado de quem registrou, os números sobem e a barra se reacomoda. É a diferença
 * entre mostrar um número e mostrar o que o produto faz.
 *
 * Começa empatado em 25 e não termina: o roteiro dá a volta, porque a promessa é a disputa
 * continuar, não alguém ganhar. Ninguém finge que os dados são de alguém, e o par não tem
 * nome próprio, porque um nome inventado sugeriria uma pessoa real.
 *
 * Respeita `prefers-reduced-motion`: quem pediu menos movimento vê o primeiro lance e o
 * placar parado ali.
 */
function ArenaCard() {
  const { t } = useTranslation()
  /*
    `returnObjects` devolve o array do bundle, que é `readonly` e tipado como a tupla
    literal exata do pt; o cast duplo é o que o i18next exige para lê-lo como lista. Fica
    `readonly` de propósito: a lista é o bundle de traduções, e escrever nela seria alterar
    o locale em tempo de execução.
  */
  const script = t('landing.arenaFeed', {
    returnObjects: true,
  }) as unknown as readonly { who: 'you' | 'pair'; pts: number; text: string }[]

  const [step, setStep] = useState(0)

  useEffect(() => {
    const quiet = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (quiet || script.length < 2) return
    const id = setInterval(() => setStep((n) => n + 1), 2800)
    return () => clearInterval(id)
  }, [script.length])

  /*
    O placar é derivado do passo, e não guardado em estado próprio: assim trocar de idioma
    (o que recria o roteiro) não deixa números de um roteiro sobre o texto de outro. Cada
    volta completa soma o mesmo total aos dois lados, então a disputa segue equilibrada por
    quantas voltas a pessoa ficar na página.
  */
  const played = script.slice(0, (step % script.length) + 1)
  const laps = Math.floor(step / script.length)
  const lapTotal = (who: 'you' | 'pair') =>
    script.filter((e) => e.who === who).reduce((sum, e) => sum + e.pts, 0)
  const scored = (who: 'you' | 'pair') =>
    25 + laps * lapTotal(who) + played.filter((e) => e.who === who).reduce((a, e) => a + e.pts, 0)

  const you = scored('you')
  const pair = scored('pair')
  const youPct = Math.round((you / (you + pair)) * 100)
  const last = played[played.length - 1]
  const mine = last.who === 'you'

  return (
    <div className="rounded-2xl border border-hair bg-surface p-5 shadow-[0_18px_44px_var(--arena-shadow)]">
      <div className="mb-[18px] flex items-center justify-between gap-2.5">
        <span className="text-[10.5px] font-bold uppercase tracking-[0.11em] tabular-nums text-faint">
          {t('landing.arenaSeason')}
        </span>
        <span className="shrink-0 rounded-md bg-track px-2.5 py-1 text-[11.5px] font-bold text-muted">
          {t('landing.arenaStake')}
        </span>
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <div className="flex flex-col gap-[7px]">
          <div className="flex items-center gap-2.5">
            <Avatar initial={t('landing.arenaYouAvatar')} tone="you" size={38} />
            <span className="text-[11.5px] font-bold text-muted">{t('landing.arenaYou')}</span>
          </div>
          <span className="font-display text-[40px] font-semibold leading-[.95] tracking-[-0.04em] tabular-nums text-you">
            {you}
          </span>
        </div>

        <span className="text-[11px] font-bold tracking-[0.1em] text-faint">VS</span>

        <div className="flex flex-col items-end gap-[7px] text-right">
          <div className="flex flex-row-reverse items-center gap-2.5">
            <Avatar initial={t('landing.arenaRivalAvatar')} tone="rival" size={38} />
            <span className="text-[11.5px] font-bold text-muted">{t('landing.arenaRival')}</span>
          </div>
          <span className="font-display text-[40px] font-semibold leading-[.95] tracking-[-0.04em] tabular-nums text-pair">
            {pair}
          </span>
        </div>
      </div>

      <div className="mt-[18px]">
        <div
          className="relative flex h-3.5 overflow-hidden rounded-full bg-track"
          role="img"
          aria-label={t('dashboard.barSplit', { you: youPct, pair: 100 - youPct })}
        >
          <div
            className="vp-live bg-you transition-[width] duration-500 ease-out"
            style={{ width: `${youPct}%` }}
          />
          <div className="vp-live vp-delay flex-1 bg-pair" />
          {/*
            A juntura: onde os dois se encontram. Sem ela, duas cores coladas leem como uma
            barra de progresso com duas fases; com ela, leem como dois lados se empurrando,
            que é o que o placar realmente é.
          */}
          {/*
            Dentro da trilha, e não transbordando: a trilha corta o que passa da borda
            (`overflow-hidden`, que é o que arredonda as pontas da barra), então uma juntura
            que se estendesse para fora simplesmente sumiria.
          */}
          <span
            aria-hidden="true"
            className="absolute inset-y-0 w-[3px] -translate-x-[1.5px] bg-surface transition-[left] duration-500 ease-out"
            style={{ left: `${youPct}%` }}
          />
        </div>
        <div className="mt-2 flex justify-between text-[11.5px] font-bold">
          <span className="text-you">{`${t('landing.arenaYou')} ${youPct}%`}</span>
          <span className="text-pair">{`${t('landing.arenaRival')} ${100 - youPct}%`}</span>
        </div>
      </div>

      {/*
        aria-live: quem usa leitor de tela ouve cada lance conforme ele entra, que é a
        informação que o movimento carrega para quem enxerga.
      */}
      <div
        aria-live="polite"
        className="mt-4 flex min-h-[44px] items-center gap-2.5 border-t border-hair pt-3.5"
      >
        <Avatar
          initial={mine ? t('landing.arenaYouAvatar') : t('landing.arenaRivalAvatar')}
          tone={mine ? 'you' : 'rival'}
          size={26}
        />
        <span
          key={step}
          className="min-w-0 flex-1 animate-[vp-fade-up_450ms_ease-out] text-[13px] font-semibold text-ink"
        >
          {last.text}
        </span>
        <span
          className={`shrink-0 rounded-md px-2.5 py-[3px] text-[11.5px] font-bold tabular-nums ${
            mine ? 'bg-you-soft text-you' : 'bg-pair-soft text-pair'
          }`}
        >
          {t('landing.arenaPts', { n: last.pts })}
        </span>
      </div>
    </div>
  )
}

export function Hero() {
  const { t } = useTranslation()
  return (
    /*
      Duas colunas a partir de lg, empilhadas antes disso: no telefone o cartão vem depois
      da promessa e dos botões, porque ali a decisão é rolar ou sair, e a chamada tem de
      caber na primeira tela.
    */
    <header className="mx-auto grid max-w-[1100px] items-center gap-10 px-5 pb-12 pt-10 sm:px-8 lg:grid-cols-[1.05fr_1fr] lg:gap-14 lg:pt-16">
      <div>
        <span className="mb-5 inline-flex items-center gap-2 rounded-full bg-pair-soft px-3.5 py-1.5 text-xs font-extrabold text-pair-ink">
          {t('landing.heroBadge')}
        </span>
        <h1 className="mb-5 font-display text-[34px] font-semibold leading-[1.04] tracking-[-0.03em] text-ink sm:text-[46px] lg:text-[54px]">
          {t('landing.heroTitlePre')}
          <span className="text-act">{t('landing.heroTitleHi')}</span>
          {t('landing.heroTitlePost')}
        </h1>
        <p className="mb-8 max-w-[520px] text-base font-semibold leading-relaxed text-muted sm:text-[17px]">
          {t('landing.heroSubtitle')}
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/register"
            className="rounded-2xl bg-act px-7 py-3.5 text-[15px] font-extrabold text-on-fill transition hover:brightness-110"
          >
            {t('landing.start')}
          </Link>
          <a
            href="#como-funciona"
            className="rounded-2xl border border-edge bg-surface px-6 py-3.5 text-[15px] font-extrabold text-ink transition hover:border-act"
          >
            {t('landing.heroSee')}
          </a>
        </div>

        <p className="mt-6 text-[12.5px] font-bold text-muted">{t('landing.heroAvatars')}</p>
      </div>

      <ArenaCard />
    </header>
  )
}

/* ===================== COMO FUNCIONA ===================== */

export function ComoFunciona() {
  const { t } = useTranslation()
  return (
    <section id="como-funciona" className="mx-auto max-w-[1100px] px-5 py-12 sm:px-8 lg:py-14">
      <div className="mb-9 text-center">
        <div className="mb-2.5 text-xs font-extrabold tracking-[0.1em] text-brand-ink">
          {t('landing.howKicker')}
        </div>
        <h2 className="font-display text-[28px] font-semibold tracking-[-0.02em] text-ink sm:text-[34px]">
          {t('landing.howTitle')}
        </h2>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StepCard
          tone="brand"
          icon={
            <path d="M9 4h6l1.2 2H20a2 2 0 012 2v9a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2h2.8zm3 4.5A4.2 4.2 0 1012 17a4.2 4.2 0 000-8.5z" />
          }
          title={t('landing.howS1Title')}
          text={t('landing.howS1Text')}
        />
        <StepCard
          tone="rival"
          icon={
            // duas pessoas distintas (uma na frente, outra atrás à direita)
            <path d="M9 11a3.4 3.4 0 100-6.8A3.4 3.4 0 009 11zm6.6-.8a2.9 2.9 0 100-5.8 2.9 2.9 0 000 5.8zM9 12.6c-3.2 0-5.8 1.7-5.8 3.9V19h11.6v-2.5c0-2.2-2.6-3.9-5.8-3.9zm6.6.4c-.5 0-1 .04-1.5.12 1.2.9 2 2.1 2 3.48V19H21v-2.2c0-1.9-2.3-3.4-5.4-3.4z" />
          }
          title={t('landing.howS2Title')}
          text={t('landing.howS2Text')}
        />
        <StepCard
          tone="success"
          icon={
            <path d="M12 2l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17l-5.8 3 1.1-6.5L2.6 8.8l6.5-.9z" />
          }
          title={t('landing.howS3Title')}
          text={t('landing.howS3Text')}
        />
      </div>
    </section>
  )
}

export function StepCard({
  tone,
  icon,
  title,
  text,
}: {
  tone: 'brand' | 'rival' | 'success'
  icon: ReactNode
  title: string
  text: string
}) {
  const toneClasses = {
    brand: 'bg-brand-soft fill-brand',
    rival: 'bg-rival-soft fill-rival',
    success: 'bg-success-soft fill-success',
  }[tone]

  return (
    <div className="rounded-3xl border border-hair bg-surface p-6">
      <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl ${toneClasses}`}>
        <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
          {icon}
        </svg>
      </div>
      <h3 className="mb-2 font-display text-lg font-semibold text-ink">{title}</h3>
      <p className="text-[13.5px] font-semibold leading-relaxed text-muted">{text}</p>
    </div>
  )
}

/* ===================== TEMPORADA ===================== */

export function Temporada() {
  const { t } = useTranslation()
  return (
    <section id="temporada" className="mx-auto max-w-[1100px] px-5 pb-14 pt-2 sm:px-8">
      <div className="grid items-center gap-10 rounded-[26px] border border-arena-border bg-arena p-7 shadow-[0_20px_50px_var(--arena-shadow)] sm:p-11 lg:grid-cols-2">
        <div>
          <h2 className="mb-4 font-display text-[26px] font-semibold leading-tight tracking-[-0.02em] text-arena-text sm:text-[32px]">
            {t('landing.seasonTitle')}
          </h2>
          <p className="mb-6 text-[15px] font-semibold leading-relaxed text-arena-muted">
            {t('landing.seasonText')}
          </p>

          <div className="flex flex-col gap-3">
            <CheckRow tone="bg-brand">{t('landing.seasonC1')}</CheckRow>
            <CheckRow tone="bg-rival">{t('landing.seasonC2')}</CheckRow>
            <CheckRow tone="bg-success">{t('landing.seasonC3')}</CheckRow>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2 rounded-2xl border border-arena-line bg-white/[0.06] px-4 py-4 sm:px-5">
            <Stat value="30" label={t('landing.seasonStat1')} />
            <span className="h-[38px] w-px shrink-0 bg-arena-line" />
            <Stat value="+10" label={t('landing.seasonStat2')} />
            <span className="h-[38px] w-px shrink-0 bg-arena-line" />
            <Stat value="2" label={t('landing.seasonStat3')} />
          </div>

          <div className="flex items-center gap-3.5 rounded-2xl border border-arena-line bg-white/[0.06] px-5 py-4">
            <svg
              viewBox="0 0 24 24"
              className="h-[22px] w-[22px] flex-shrink-0 fill-brand"
              aria-hidden="true"
            >
              <path d="M12 2c1 3-1.5 4-1.5 7A1.5 1.5 0 0012 10c.8-1.6 2.5-1.4 2.5.5 0 1-.7 1.5-.7 2.5 2-1 3-3 2.7-5.5C19 10 20 12.5 20 15a8 8 0 01-16 0c0-4 3-5.5 4-8 .8 1.6 2.5 2 4 1.5C15 7 13 4 12 2z" />
            </svg>
            <div>
              <div className="text-sm font-extrabold text-arena-text">
                {t('landing.seasonStreakTitle')}
              </div>
              <div className="mt-0.5 text-xs font-bold text-arena-muted">
                {t('landing.seasonStreakText')}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export function CheckRow({ tone, children }: { tone: string; children: ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg ${tone}`}>
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-white" aria-hidden="true">
          <path d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z" />
        </svg>
      </span>
      <span className="text-sm font-bold text-arena-text">{children}</span>
    </div>
  )
}

export function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="min-w-0 flex-1 text-center">
      <div className="font-display text-[24px] font-semibold leading-none text-arena-text sm:text-[28px]">
        {value}
      </div>
      <div className="mt-1 text-[11px] font-bold leading-tight text-arena-muted">{label}</div>
    </div>
  )
}

/* ===================== CTA FINAL ===================== */

/**
 * O fechamento, como cartão.
 *
 * Era texto solto no fim da página, com a divisória do rodapé presa dentro dele: a linha
 * saía curta, do tamanho da coluna de texto, e o fim da página parecia ter sido cortado.
 * Aqui o convite é um objeto com borda e fundo, que é o que faz uma última chamada parecer
 * uma decisão a tomar e não um parágrafo que sobrou.
 */
export function CtaFinal() {
  const { t } = useTranslation()
  return (
    <section className="mx-auto max-w-[1100px] px-5 pb-14 pt-4 sm:px-8">
      <div className="rounded-[18px] border border-hair bg-surface px-6 py-10 text-center shadow-[0_18px_44px_var(--arena-shadow)] sm:px-12 sm:py-12">
        <h2 className="mb-3 font-display text-[26px] font-semibold tracking-[-0.035em] text-ink sm:text-[34px]">
          {t('landing.ctaTitle')}
        </h2>
        <p className="mx-auto max-w-[60ch] text-[16px] font-semibold leading-relaxed text-muted sm:text-[17px]">
          {t('landing.ctaText')}
        </p>
        <div className="mt-6">
          <Link
            to="/register"
            className="inline-block rounded-2xl bg-act px-8 py-4 text-base font-extrabold text-on-fill transition hover:brightness-110"
          >
            {t('landing.ctaButton')}
          </Link>
        </div>
        <p className="mt-3 text-[13px] font-semibold text-faint">{t('landing.ctaNote')}</p>
      </div>
    </section>
  )
}
