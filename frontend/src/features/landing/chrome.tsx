import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import { BrandMark } from '@/components/brand/BrandMark'
import { LanguageSelect } from '@/components/LanguageSelect'
import { useTheme } from '@/hooks/useTheme'

/**
 * The bar across the top of the landing page, and the avatar glyph it uses.
 *
 * Moved out of LandingPage verbatim, markup untouched. This is the only part of the page
 * that holds state: the menu opens and the theme toggles. Everything below it is static.
 */

/** Silhueta de pessoa (branca) pra encher as bolinhas de avatar. */
export function PersonGlyph({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M12 12a4 4 0 100-8 4 4 0 000 8zm0 1.6c-3.3 0-6 1.9-6 4.2V20h12v-2.2c0-2.3-2.7-4.2-6-4.2z" />
    </svg>
  )
}

/* ===================== NAV ===================== */

export function Nav() {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)

  return (
    <nav className="relative mx-auto flex max-w-[1100px] items-center justify-between gap-3 px-4 py-4 sm:px-8 sm:py-5">
      <Link to="/" onClick={close} className="flex shrink-0 items-center gap-2.5">
        <BrandMark size={34} />
        <div className="leading-none">
          <div className="font-display text-[19px] font-semibold tracking-tight text-ink">
            VitalPair
          </div>
          <div className="mt-[3px] hidden text-[9px] font-extrabold uppercase tracking-[0.05em] text-muted sm:block">
            {t('landing.brandTagline')}
          </div>
        </div>
      </Link>

      {/* Desktop (md+): tudo aberto na barra */}
      <div className="hidden items-center gap-5 md:flex">
        <a
          href="#como-funciona"
          className="text-[13.5px] font-bold text-muted transition hover:text-ink"
        >
          {t('landing.navHow')}
        </a>
        <a
          href="#temporada"
          className="text-[13.5px] font-bold text-muted transition hover:text-ink"
        >
          {t('landing.navSeason')}
        </a>
        <LanguageSelect />
        <ThemeToggle />
        <Link
          to="/login"
          className="text-[13.5px] font-extrabold text-ink transition hover:text-brand-ink"
        >
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
            <a
              href="#como-funciona"
              onClick={close}
              className="block rounded-xl px-3 py-2.5 text-sm font-bold text-ink transition hover:bg-track"
            >
              {t('landing.navHow')}
            </a>
            <a
              href="#temporada"
              onClick={close}
              className="block rounded-xl px-3 py-2.5 text-sm font-bold text-ink transition hover:bg-track"
            >
              {t('landing.navSeason')}
            </a>
            <Link
              to="/login"
              onClick={close}
              className="block rounded-xl px-3 py-2.5 text-sm font-bold text-ink transition hover:bg-track"
            >
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

export function ThemeToggle() {
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
