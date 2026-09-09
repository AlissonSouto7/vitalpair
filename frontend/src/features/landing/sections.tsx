import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import { PersonGlyph } from './chrome'

import { BrandMark } from '@/components/brand/BrandMark'

/**
 * The sections the landing page stacks, in the order a visitor scrolls through them.
 *
 * Moved out of LandingPage verbatim, markup untouched. All static: the copy comes from i18n
 * and nothing here holds state or fetches.
 */

export function Hero() {
  const { t } = useTranslation()
  return (
    <header className="mx-auto max-w-[720px] px-5 pb-10 pt-10 text-center sm:px-8 lg:pt-16">
      <span className="mb-5 inline-flex items-center gap-2 rounded-full bg-rival-soft px-3.5 py-1.5 text-xs font-extrabold text-rival-ink">
        {t('landing.heroBadge')}
      </span>
      <h1 className="mb-5 font-display text-[32px] font-semibold leading-[1.06] tracking-[-0.03em] text-ink sm:text-[44px] lg:text-[52px]">
        {t('landing.heroTitlePre')}
        <span className="text-brand">{t('landing.heroTitleHi')}</span>
        {t('landing.heroTitlePost')}
      </h1>
      <p className="mx-auto mb-8 max-w-[520px] text-base font-semibold leading-relaxed text-muted sm:text-[17px]">
        {t('landing.heroSubtitle')}
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link
          to="/register"
          className="rounded-2xl bg-brand px-7 py-3.5 text-[15px] font-extrabold text-white transition hover:brightness-105"
        >
          {t('landing.start')}
        </Link>
        <a
          href="#como-funciona"
          className="rounded-2xl border border-hair bg-surface px-6 py-3.5 text-[15px] font-extrabold text-ink transition hover:border-brand"
        >
          {t('landing.heroSee')}
        </a>
      </div>

      <div className="mt-7 flex items-center justify-center gap-2.5">
        <div className="flex">
          <span className="flex h-[30px] w-[30px] items-center justify-center rounded-full border-2 border-canvas bg-brand">
            <PersonGlyph className="h-[17px] w-[17px] text-white" />
          </span>
          <span className="-ml-2.5 flex h-[30px] w-[30px] items-center justify-center rounded-full border-2 border-canvas bg-rival">
            <PersonGlyph className="h-[17px] w-[17px] text-white" />
          </span>
          <span className="-ml-2.5 flex h-[30px] w-[30px] items-center justify-center rounded-full border-2 border-canvas bg-success">
            <PersonGlyph className="h-[17px] w-[17px] text-white" />
          </span>
        </div>
        <span className="text-[12.5px] font-bold text-muted">{t('landing.heroAvatars')}</span>
      </div>
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

export function CtaFinal() {
  const { t } = useTranslation()
  return (
    <section className="mx-auto max-w-[760px] px-5 pb-16 pt-2 text-center sm:px-8">
      <div className="mb-5 flex justify-center">
        <BrandMark size={58} />
      </div>
      <h2 className="mb-3 font-display text-[30px] font-semibold tracking-[-0.02em] text-ink sm:text-[36px]">
        {t('landing.ctaTitle')}
      </h2>
      <p className="mb-7 text-[15px] font-semibold text-muted">{t('landing.ctaText')}</p>
      <Link
        to="/register"
        className="inline-block rounded-2xl bg-brand px-8 py-4 text-base font-extrabold text-white transition hover:brightness-105"
      >
        {t('landing.ctaButton')}
      </Link>

      <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-hair pt-6 sm:flex-row">
        <span className="text-[12.5px] font-bold text-muted">{t('landing.footerRights')}</span>
        <div className="flex gap-4 text-[12.5px] font-bold text-muted">
          <Link to="/privacidade" className="transition hover:text-ink">
            {t('landing.footerPrivacy')}
          </Link>
          <Link to="/termos" className="transition hover:text-ink">
            {t('landing.footerTerms')}
          </Link>
          <Link to="/contato" className="transition hover:text-ink">
            {t('landing.footerContact')}
          </Link>
        </div>
      </div>
    </section>
  )
}
