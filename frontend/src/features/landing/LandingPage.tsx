import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useTheme } from '../../hooks/useTheme'
import { BrandMark } from '../../components/brand/BrandMark'
import { LanguageSelect } from '../../components/LanguageSelect'

/**
 * Landing pública (logado-out) do VitalPair.
 * Página standalone de marketing: sem Layout/sidebar, scroll próprio.
 * Copy via i18n (PT/EN/ES/FR), tom humano e brasileiro. Só tokens, nunca hex.
 */
export function LandingPage() {
  return (
    <div className="min-h-screen bg-canvas text-ink">
      <Nav />
      <Hero />
      <ComoFunciona />
      <Temporada />
      <CtaFinal />
    </div>
  )
}

/** Silhueta de pessoa (branca) pra encher as bolinhas de avatar. */
function PersonGlyph({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M12 12a4 4 0 100-8 4 4 0 000 8zm0 1.6c-3.3 0-6 1.9-6 4.2V20h12v-2.2c0-2.3-2.7-4.2-6-4.2z" />
    </svg>
  )
}

/* ===================== NAV ===================== */

function Nav() {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)

  return (
    <nav className="relative mx-auto flex max-w-[1100px] items-center justify-between gap-3 px-4 py-4 sm:px-8 sm:py-5">
      <Link to="/" onClick={close} className="flex shrink-0 items-center gap-2.5">
        <BrandMark size={34} />
        <div className="leading-none">
          <div className="font-display text-[19px] font-semibold tracking-tight text-ink">VitalPair</div>
          <div className="mt-[3px] hidden text-[9px] font-extrabold uppercase tracking-[0.05em] text-muted sm:block">
            {t('landing.brandTagline')}
          </div>
        </div>
      </Link>

      {/* Desktop (md+): tudo aberto na barra */}
      <div className="hidden items-center gap-5 md:flex">
        <a href="#como-funciona" className="text-[13.5px] font-bold text-muted transition hover:text-ink">
          {t('landing.navHow')}
        </a>
        <a href="#temporada" className="text-[13.5px] font-bold text-muted transition hover:text-ink">
          {t('landing.navSeason')}
        </a>
        <LanguageSelect />
        <ThemeToggle />
        <Link to="/login" className="text-[13.5px] font-extrabold text-ink transition hover:text-brand-ink">
          {t('landing.login')}
        </Link>
        <Link
          to="/register"
          className="rounded-xl bg-brand px-4 py-2.5 text-[13.5px] font-extrabold text-white transition hover:brightness-105"
        >
          {t('landing.start')}
        </Link>
      </div>

      {/* Mobile (<md): só CTA + hambúrguer; o resto vai no menu */}
      <div className="flex items-center gap-2 md:hidden">
        <Link
          to="/register"
          className="rounded-xl bg-brand px-3.5 py-2 text-[13px] font-extrabold text-white transition hover:brightness-105"
        >
          {t('landing.start')}
        </Link>
        <button
          onClick={() => setOpen((o) => !o)}
          aria-label={t('landing.menuOpen')}
          aria-expanded={open}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-hair text-ink"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
            {open ? (
              <path d="M6.4 5 5 6.4 10.6 12 5 17.6 6.4 19 12 13.4 17.6 19 19 17.6 13.4 12 19 6.4 17.6 5 12 10.6z" />
            ) : (
              <path d="M3 6h18v2H3zm0 5h18v2H3zm0 5h18v2H3z" />
            )}
          </svg>
        </button>
      </div>

      {/* Menu mobile */}
      {open && (
        <>
          <button
            aria-label={t('landing.menuClose')}
            onClick={close}
            className="fixed inset-0 z-20 cursor-default md:hidden"
          />
          <div className="absolute left-3 right-3 top-full z-30 mt-1 rounded-2xl border border-hair bg-surface p-3 shadow-[0_18px_40px_rgba(70,45,20,0.18)] md:hidden">
            <a href="#como-funciona" onClick={close} className="block rounded-xl px-3 py-2.5 text-sm font-bold text-ink transition hover:bg-track">
              {t('landing.navHow')}
            </a>
            <a href="#temporada" onClick={close} className="block rounded-xl px-3 py-2.5 text-sm font-bold text-ink transition hover:bg-track">
              {t('landing.navSeason')}
            </a>
            <Link to="/login" onClick={close} className="block rounded-xl px-3 py-2.5 text-sm font-bold text-ink transition hover:bg-track">
              {t('landing.login')}
            </Link>
            <div className="my-2 h-px bg-hair" />
            <div className="flex items-center justify-between px-1">
              <LanguageSelect />
              <ThemeToggle />
            </div>
          </div>
        </>
      )}
    </nav>
  )
}

function ThemeToggle() {
  const { t } = useTranslation()
  const { theme, toggle } = useTheme()
  return (
    <button
      onClick={toggle}
      aria-label={theme === 'dark' ? t('landing.themeToLight') : t('landing.themeToDark')}
      className="flex h-9 w-9 items-center justify-center rounded-xl border border-hair text-muted transition hover:text-ink"
    >
      {theme === 'dark' ? (
        <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] fill-current" aria-hidden="true">
          <path d="M12 7a5 5 0 100 10 5 5 0 000-10zm0-6.5a1.3 1.3 0 011.3 1.3v1.4a1.3 1.3 0 01-2.6 0V1.8A1.3 1.3 0 0112 .5zm0 18.6a1.3 1.3 0 011.3 1.3v1.4a1.3 1.3 0 01-2.6 0v-1.4a1.3 1.3 0 011.3-1.3zM23.5 12a1.3 1.3 0 01-1.3 1.3h-1.4a1.3 1.3 0 010-2.6h1.4A1.3 1.3 0 0123.5 12zM4.9 12a1.3 1.3 0 01-1.3 1.3H2.2a1.3 1.3 0 010-2.6h1.4A1.3 1.3 0 014.9 12z" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] fill-current" aria-hidden="true">
          <path d="M20 14.5A8 8 0 119.5 4 6.5 6.5 0 0020 14.5z" />
        </svg>
      )}
    </button>
  )
}

/* ===================== HERO ===================== */

function Hero() {
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

function ComoFunciona() {
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

function StepCard({
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

function Temporada() {
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
            <svg viewBox="0 0 24 24" className="h-[22px] w-[22px] flex-shrink-0 fill-brand" aria-hidden="true">
              <path d="M12 2c1 3-1.5 4-1.5 7A1.5 1.5 0 0012 10c.8-1.6 2.5-1.4 2.5.5 0 1-.7 1.5-.7 2.5 2-1 3-3 2.7-5.5C19 10 20 12.5 20 15a8 8 0 01-16 0c0-4 3-5.5 4-8 .8 1.6 2.5 2 4 1.5C15 7 13 4 12 2z" />
            </svg>
            <div>
              <div className="text-sm font-extrabold text-arena-text">{t('landing.seasonStreakTitle')}</div>
              <div className="mt-0.5 text-xs font-bold text-arena-muted">{t('landing.seasonStreakText')}</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function CheckRow({ tone, children }: { tone: string; children: ReactNode }) {
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

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="min-w-0 flex-1 text-center">
      <div className="font-display text-[24px] font-semibold leading-none text-arena-text sm:text-[28px]">{value}</div>
      <div className="mt-1 text-[11px] font-bold leading-tight text-arena-muted">{label}</div>
    </div>
  )
}

/* ===================== CTA FINAL ===================== */

function CtaFinal() {
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
          <Link to="/privacidade" className="transition hover:text-ink">{t('landing.footerPrivacy')}</Link>
          <Link to="/termos" className="transition hover:text-ink">{t('landing.footerTerms')}</Link>
          <Link to="/contato" className="transition hover:text-ink">{t('landing.footerContact')}</Link>
        </div>
      </div>
    </section>
  )
}
