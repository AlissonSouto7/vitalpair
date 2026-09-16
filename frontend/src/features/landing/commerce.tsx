import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

/**
 * As duas seções que fecham a venda: o preço e as objeções.
 *
 * Separadas de `sections.tsx` porque são a parte comercial da página, e porque aquele
 * arquivo passava do limite de linhas do projeto com as duas dentro. A divisão é por
 * assunto: ali fica o que explica o produto, aqui o que responde "quanto custa" e "e se".
 */

/* ===================== PREÇO ===================== */

/** Um item da lista de um plano: o que ele tem, ou o que ele não tem. */
function Feat({ children, has = true }: { children: ReactNode; has?: boolean }) {
  return (
    <li className={`flex items-start gap-2.5 text-sm ${has ? '' : 'text-faint'}`}>
      <span
        aria-hidden="true"
        className={`mt-[1px] grid h-[17px] w-[17px] flex-none place-items-center rounded-[5px] text-[10px] font-extrabold ${
          has ? 'bg-success-soft text-success' : 'bg-track text-faint'
        }`}
      >
        {has ? '✓' : '–'}
      </span>
      {children}
    </li>
  )
}

/**
 * Os dois planos, lado a lado.
 *
 * O grátis vem primeiro e listado por inteiro, não como um resumo: a promessa da página é
 * que o jogo não custa nada, e um plano gratuito espremido ao lado do pago faria essa
 * promessa parecer isca. O que falta nele aparece como falta, com o traço, em vez de ser
 * omitido, porque esconder o limite é o que faz alguém se sentir enganado depois.
 */
export function Preco() {
  const { t } = useTranslation()
  const free = t('landing.planFreeFeats', { returnObjects: true }) as unknown as readonly string[]
  const pair = t('landing.planPairFeats', { returnObjects: true }) as unknown as readonly string[]

  return (
    <section id="preco" className="mx-auto max-w-[1100px] px-5 py-12 sm:px-8 lg:py-16">
      <div className="mb-8 max-w-[62ch] lg:mb-10">
        <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-faint">
          {t('landing.priceKicker')}
        </span>
        <h2 className="mb-3 mt-2.5 font-display text-[26px] font-semibold tracking-[-0.035em] text-ink sm:text-[34px]">
          {t('landing.priceTitle')}
        </h2>
        <p className="text-[16px] font-semibold leading-relaxed text-muted sm:text-[17px]">
          {t('landing.priceLede')}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col rounded-2xl border border-hair bg-surface p-6 shadow-[0_2px_8px_var(--arena-shadow)]">
          <span className="text-xs font-bold uppercase tracking-[0.1em] text-faint">
            {t('landing.planFreeName')}
          </span>
          <div className="mb-1 mt-3 font-display text-[42px] font-semibold leading-none tracking-[-0.035em] text-ink">
            {t('landing.planFreePrice')}
          </div>
          <p className="mb-[18px] text-[13.5px] font-semibold text-muted">
            {t('landing.planFreeSub')}
          </p>
          <ul className="mb-5 flex flex-1 flex-col gap-2.5">
            {free.map((line) => (
              <Feat key={line}>{line}</Feat>
            ))}
            <Feat has={false}>{t('landing.planFreeMissing')}</Feat>
          </ul>
          <Link
            to="/register"
            className="rounded-xl bg-track px-5 py-3 text-center text-sm font-extrabold text-ink transition hover:brightness-95"
          >
            {t('landing.planFreeCta')}
          </Link>
        </div>

        <div className="relative flex flex-col rounded-2xl border border-act bg-surface p-6 shadow-[0_18px_44px_var(--arena-shadow)]">
          <span className="absolute -top-[11px] left-6 rounded-full bg-act px-3 py-1 text-[11px] font-bold text-on-fill">
            {t('landing.planPairBadge')}
          </span>
          <span className="text-xs font-bold uppercase tracking-[0.1em] text-faint">
            {t('landing.planPairName')}
          </span>
          <div className="mb-1 mt-3 flex items-baseline gap-1.5">
            <span className="font-display text-[42px] font-semibold leading-none tracking-[-0.035em] text-ink">
              {t('landing.planPairPrice')}
            </span>
            <span className="text-[13.5px] font-semibold text-muted">
              {t('landing.planPairPer')}
            </span>
          </div>
          <p className="mb-[18px] text-[13.5px] font-semibold text-muted">
            {t('landing.planPairSub')}
          </p>
          <ul className="mb-5 flex flex-1 flex-col gap-2.5">
            {pair.map((line) => (
              <Feat key={line}>{line}</Feat>
            ))}
          </ul>
          <Link
            to="/register"
            className="rounded-xl bg-act px-5 py-3 text-center text-sm font-extrabold text-on-fill transition hover:brightness-110"
          >
            {t('landing.planPairCta')}
          </Link>
        </div>
      </div>
    </section>
  )
}

/* ===================== DÚVIDAS ===================== */

/**
 * As quatro objeções que fazem alguém fechar a aba.
 *
 * Ficam antes do fechamento de propósito: quem chegou até aqui já entendeu o produto, e o
 * que sobra é o motivo para não começar. Respondidas direto, sem rodeio, porque uma resposta
 * evasiva confirma a desconfiança em vez de desfazê-la.
 */
export function Duvidas() {
  const { t } = useTranslation()
  const items = t('landing.faq', { returnObjects: true }) as unknown as readonly {
    q: string
    a: string
  }[]

  return (
    <section id="duvidas" className="mx-auto max-w-[1100px] px-5 py-12 sm:px-8 lg:py-16">
      <div className="mb-8 max-w-[62ch] lg:mb-10">
        <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-faint">
          {t('landing.faqKicker')}
        </span>
        <h2 className="mt-2.5 font-display text-[26px] font-semibold tracking-[-0.035em] text-ink sm:text-[34px]">
          {t('landing.faqTitle')}
        </h2>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {items.map((item) => (
          <div
            key={item.q}
            className="rounded-xl border border-hair bg-surface p-[18px] shadow-[0_2px_8px_var(--arena-shadow)]"
          >
            <h3 className="mb-[7px] font-display text-[15.5px] font-semibold tracking-[-0.025em] text-ink">
              {item.q}
            </h3>
            <p className="text-sm font-semibold leading-relaxed text-muted">{item.a}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
