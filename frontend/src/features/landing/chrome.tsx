import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import { BrandMark } from '@/components/brand/BrandMark'
import { LanguageSelect } from '@/components/LanguageSelect'
import { useTheme } from '@/hooks/useTheme'

/**
 * The bar across the top of the landing page.
 *
 * Fica presa no topo enquanto a pessoa desce: a página é longa e o "Começar grátis" é o
 * que ela veio fazer, então a decisão tem de continuar ao alcance depois do preço e das
 * dúvidas, e não só no primeiro terço.
 *
 * A faixa atravessa a tela inteira e o conteúdo vive numa coluna centrada dentro dela,
 * porque a borda inferior e o desfoque só separam a barra do que passa por baixo se forem
 * de ponta a ponta. `color-mix` no fundo: opaco demais, a barra vira um bloco flutuante;
 * transparente demais, o texto que rola por baixo atravessa.
 *
 * É a única parte da página que guarda estado: o menu abre e o tema alterna.
 */

/* ===================== NAV ===================== */

export function Nav() {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)

  return (
    <div
      className="sticky z-40 border-b border-hair backdrop-blur-[10px]"
      style={{
        top: 'env(safe-area-inset-top, 0px)',
        background: 'color-mix(in srgb, var(--canvas) 88%, transparent)',
      }}
    >
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
          <a href="#preco" className="text-[13.5px] font-bold text-muted transition hover:text-ink">
            {t('landing.navPrice')}
          </a>
          <a
            href="#duvidas"
            className="text-[13.5px] font-bold text-muted transition hover:text-ink"
          >
            {t('landing.navFaq')}
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
            className="rounded-xl bg-brand px-4 py-2.5 text-[13.5px] font-extrabold text-on-fill transition hover:brightness-105"
          >
            {t('landing.start')}
          </Link>
        </div>

        {/* Mobile (<md): só CTA + hambúrguer; o resto vai no menu */}
        <div className="flex items-center gap-2 md:hidden">
          <Link
            to="/register"
            className="rounded-xl bg-brand px-3.5 py-2 text-[13px] font-extrabold text-on-fill transition hover:brightness-105"
          >
            {t('landing.start')}
          </Link>
          <button
            onClick={() => setOpen((o) => !o)}
            aria-label={t('landing.menuOpen')}
            aria-expanded={open}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-edge text-ink"
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
              <a
                href="#preco"
                onClick={close}
                className="block rounded-xl px-3 py-2.5 text-sm font-bold text-ink transition hover:bg-track"
              >
                {t('landing.navPrice')}
              </a>
              <a
                href="#duvidas"
                onClick={close}
                className="block rounded-xl px-3 py-2.5 text-sm font-bold text-ink transition hover:bg-track"
              >
                {t('landing.navFaq')}
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
    </div>
  )
}

export function ThemeToggle() {
  const { t } = useTranslation()
  const { theme, toggle } = useTheme()
  return (
    <button
      onClick={toggle}
      aria-label={theme === 'dark' ? t('landing.themeToLight') : t('landing.themeToDark')}
      className="flex h-9 w-9 items-center justify-center rounded-xl border border-edge text-ink transition hover:bg-track"
    >
      {theme === 'dark' ? (
        /*
          Sol de oito raios, e não o anel de quatro pontas que estava aqui: com o traço fino
          e só quatro raios, o ícone lia como um alvo, e no fundo escuro sumia. Este é o
          mesmo desenho do protótipo, com disco cheio.
        */
        <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] fill-current" aria-hidden="true">
          <circle cx="12" cy="12" r="4.2" />
          <path d="M12 1.2a1.15 1.15 0 011.15 1.15v1.9a1.15 1.15 0 01-2.3 0v-1.9A1.15 1.15 0 0112 1.2zm0 16.6a1.15 1.15 0 011.15 1.15v1.9a1.15 1.15 0 01-2.3 0v-1.9A1.15 1.15 0 0112 17.8zM22.8 12a1.15 1.15 0 01-1.15 1.15h-1.9a1.15 1.15 0 010-2.3h1.9A1.15 1.15 0 0122.8 12zM6.2 12a1.15 1.15 0 01-1.15 1.15h-1.9a1.15 1.15 0 010-2.3h1.9A1.15 1.15 0 016.2 12zm13.24-7.44a1.15 1.15 0 010 1.63l-1.34 1.34a1.15 1.15 0 01-1.63-1.63l1.34-1.34a1.15 1.15 0 011.63 0zM7.53 16.47a1.15 1.15 0 010 1.63l-1.34 1.34a1.15 1.15 0 01-1.63-1.63l1.34-1.34a1.15 1.15 0 011.63 0zm11.91 2.97a1.15 1.15 0 01-1.63 0l-1.34-1.34a1.15 1.15 0 011.63-1.63l1.34 1.34a1.15 1.15 0 010 1.63zM7.53 7.53a1.15 1.15 0 01-1.63 0L4.56 6.19a1.15 1.15 0 011.63-1.63l1.34 1.34a1.15 1.15 0 010 1.63z" />
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

/* ===================== RODAPÉ ===================== */

/**
 * O rodapé, fora do CTA.
 *
 * Morava dentro da seção de fechamento, então herdava a largura de 760px e o alinhamento
 * central dela: a linha divisória parava no meio da tela e os links ficavam soltos. Um
 * rodapé é uma faixa que atravessa a página; é assim que se lê como o fim dela.
 */
export function Rodape() {
  const { t } = useTranslation()
  return (
    <footer className="border-t border-hair">
      <div className="mx-auto flex max-w-[1100px] flex-wrap items-center gap-x-4 gap-y-3 px-5 py-7 text-[13px] font-semibold text-faint sm:px-8">
        <span>{t('landing.footerRights')}</span>
        <div className="ml-auto flex gap-4">
          <Link to="/privacy" className="transition hover:text-ink">
            {t('landing.footerPrivacy')}
          </Link>
          <Link to="/terms" className="transition hover:text-ink">
            {t('landing.footerTerms')}
          </Link>
          <Link to="/contact" className="transition hover:text-ink">
            {t('landing.footerContact')}
          </Link>
        </div>
      </div>
    </footer>
  )
}
