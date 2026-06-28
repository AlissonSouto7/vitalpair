import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { BrandLockup } from '../../components/brand/BrandMark'

const MAIL = 'contato@vitapair.app'

interface LegalCallout {
  tone: 'brand' | 'rival' | 'danger'
  icon: 'info' | 'alert'
  text: string
}
interface LegalSection {
  title: string
  paragraphs?: string[]
  bullets?: [string, string][]
  callout?: LegalCallout
  calloutFirst?: boolean
  paragraphsAfter?: string[]
}

/**
 * Política de Privacidade do VitalPair.
 * Página standalone: sem Layout/sidebar, scroll próprio, só tokens.
 * Conteúdo via i18n (namespace legal.privacy). Tom honesto, claro, brasileiro.
 */
export function PrivacyPage() {
  const { t } = useTranslation()
  const sections = t('legal.privacy.sections', { returnObjects: true }) as LegalSection[]

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <LegalHeader />

      <main className="mx-auto max-w-[760px] px-5 pb-20 pt-6 sm:px-8">
        <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-rival-soft px-3.5 py-1.5 text-xs font-extrabold text-rival-ink">
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-rival" aria-hidden="true">
            <path d="M12 1 4 4v7c0 5 3.4 8.6 8 11 4.6-2.4 8-6 8-11V4zm0 6a2.5 2.5 0 012.5 2.5c0 1-.6 1.8-1.5 2.2V15a1 1 0 01-2 0v-3.3A2.5 2.5 0 0112 7z" />
          </svg>
          {t('legal.privacy.badge')}
        </span>

        <h1 className="mb-3 font-display text-[34px] font-semibold leading-[1.05] tracking-[-0.02em] text-ink sm:text-[42px]">
          {t('legal.privacy.title')}
        </h1>
        <p className="mb-2 text-base font-semibold leading-relaxed text-muted">
          {t('legal.privacy.intro')}
        </p>
        <p className="mb-9 text-[13.5px] font-bold text-faint">{t('legal.privacy.effective')}</p>

        <div className="flex flex-col gap-9">
          {sections.map((section, i) => (
            <Section key={section.title} n={String(i + 1)} section={section} />
          ))}
        </div>

        <LegalFooter />
      </main>
    </div>
  )
}

/* ===================== render genérico de seção legal ===================== */

export function Section({ n, section }: { n: string; section: LegalSection }) {
  return (
    <section className="scroll-mt-20">
      <h2 className="mb-3 flex items-baseline gap-2.5 font-display text-[22px] font-semibold tracking-[-0.01em] text-ink sm:text-[24px]">
        <span className="font-display text-[15px] font-semibold text-brand-ink">{n}.</span>
        {section.title}
      </h2>
      <div className="flex flex-col gap-3">
        {section.calloutFirst && section.callout && <Callout callout={section.callout} />}
        {section.paragraphs?.map((p, i) => <P key={i}>{withMail(p)}</P>)}
        {section.bullets && <BulletList items={section.bullets} />}
        {!section.calloutFirst && section.callout && <Callout callout={section.callout} />}
        {section.paragraphsAfter?.map((p, i) => <P key={`a-${i}`}>{withMail(p)}</P>)}
      </div>
    </section>
  )
}

/** Substitui o placeholder {{mail}} por um link mailto clicável. */
export function withMail(text: string): ReactNode {
  if (!text.includes('{{mail}}')) return text
  const [before, after] = text.split('{{mail}}')
  return (
    <>
      {before}
      <Mail>{MAIL}</Mail>
      {after}
    </>
  )
}

export function P({ children }: { children: ReactNode }) {
  return <p className="text-[15px] font-semibold leading-relaxed text-muted">{children}</p>
}

export function Mail({ children }: { children: ReactNode }) {
  return (
    <a
      href={`mailto:${children}`}
      className="cursor-pointer font-extrabold text-brand-ink underline decoration-brand/40 underline-offset-2 transition hover:decoration-brand"
    >
      {children}
    </a>
  )
}

export function BulletList({ items }: { items: [string, string][] }) {
  return (
    <ul className="flex flex-col gap-2.5">
      {items.map(([term, desc]) => (
        <li key={term} className="flex gap-3">
          <span className="mt-[7px] h-1.5 w-1.5 flex-shrink-0 rounded-full bg-brand" aria-hidden="true" />
          <span className="text-[15px] font-semibold leading-relaxed text-muted">
            <span className="font-extrabold text-ink">{term}:</span> {desc}
          </span>
        </li>
      ))}
    </ul>
  )
}

export function Callout({ callout }: { callout: LegalCallout }) {
  const toneClasses = {
    brand: 'border-brand/30 bg-brand-soft',
    rival: 'border-rival/30 bg-rival-soft',
    danger: 'border-danger/40 bg-danger-soft',
  }[callout.tone]
  const fill = callout.tone === 'brand' ? 'fill-brand' : callout.tone === 'rival' ? 'fill-rival' : 'fill-danger'

  return (
    <div className={`flex gap-3 rounded-2xl border p-4 ${toneClasses}`}>
      <svg viewBox="0 0 24 24" className={`mt-0.5 h-5 w-5 flex-shrink-0 ${fill}`} aria-hidden="true">
        {callout.icon === 'info' ? (
          <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm0 5a1.4 1.4 0 110 2.8A1.4 1.4 0 0112 7zm1.3 10h-2.6v-6h2.6z" />
        ) : (
          <path d="M12 2 1 21h22zm0 6a1.3 1.3 0 011.3 1.3v5a1.3 1.3 0 01-2.6 0v-5A1.3 1.3 0 0112 8zm0 9.5a1.4 1.4 0 110 2.8 1.4 1.4 0 010-2.8z" />
        )}
      </svg>
      <p className="text-[14px] font-bold leading-relaxed text-ink">{callout.text}</p>
    </div>
  )
}

/* ===================== chrome local ===================== */

export function LegalHeader() {
  const { t } = useTranslation()
  return (
    <header className="border-b border-hair bg-canvas/80 backdrop-blur">
      <div className="mx-auto flex max-w-[1100px] items-center justify-between px-5 py-4 sm:px-8">
        <Link to="/" className="cursor-pointer transition hover:opacity-90">
          <BrandLockup size={38} />
        </Link>
        <Link
          to="/"
          className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-hair bg-surface px-4 py-2 text-[13.5px] font-extrabold text-ink transition hover:border-brand"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
            <path d="M14 6l-6 6 6 6 1.4-1.4L10.8 12l4.6-4.6z" />
          </svg>
          {t('legal.back')}
        </Link>
      </div>
    </header>
  )
}

export function LegalFooter({ exclude = 'privacy' }: { exclude?: 'privacy' | 'terms' | 'contact' }) {
  const { t } = useTranslation()
  const links: { key: 'privacy' | 'terms' | 'contact'; to: string; label: string }[] = [
    { key: 'privacy', to: '/privacidade', label: t('legal.footerPrivacy') },
    { key: 'terms', to: '/termos', label: t('legal.footerTerms') },
    { key: 'contact', to: '/contato', label: t('legal.footerContact') },
  ]
  return (
    <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-hair pt-6 text-center sm:flex-row sm:text-left">
      <span className="text-[12.5px] font-bold text-muted">{t('legal.footerRights')}</span>
      <div className="flex gap-4 text-[12.5px] font-bold text-muted">
        {links
          .filter((l) => l.key !== exclude)
          .map((l) => (
            <Link key={l.key} to={l.to} className="cursor-pointer transition hover:text-ink">
              {l.label}
            </Link>
          ))}
      </div>
    </div>
  )
}
