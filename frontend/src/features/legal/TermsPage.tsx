import { useTranslation } from 'react-i18next'
import { LegalHeader, LegalFooter, Section } from './PrivacyPage'

interface LegalSection {
  title: string
  paragraphs?: string[]
  bullets?: [string, string][]
  callout?: { tone: 'brand' | 'rival' | 'danger'; icon: 'info' | 'alert'; text: string }
  paragraphsAfter?: string[]
}

/**
 * Termos de Uso do VitalPair.
 * Página standalone: sem Layout/sidebar, scroll próprio, só tokens.
 * Conteúdo via i18n (namespace legal.terms). Tom honesto, claro, brasileiro.
 */
export function TermsPage() {
  const { t } = useTranslation()
  const sections = t('legal.terms.sections', { returnObjects: true }) as LegalSection[]

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <LegalHeader />

      <main className="mx-auto max-w-[760px] px-5 pb-20 pt-6 sm:px-8">
        <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-brand-soft px-3.5 py-1.5 text-xs font-extrabold text-brand-ink">
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-brand" aria-hidden="true">
            <path d="M6 2h9l5 5v13a2 2 0 01-2 2H6a2 2 0 01-2-2V4a2 2 0 012-2zm8 1.5V8h4.5zM8 12h8v1.6H8zm0 3.5h8v1.6H8z" />
          </svg>
          {t('legal.terms.badge')}
        </span>

        <h1 className="mb-3 font-display text-[34px] font-semibold leading-[1.05] tracking-[-0.02em] text-ink sm:text-[42px]">
          {t('legal.terms.title')}
        </h1>
        <p className="mb-2 text-base font-semibold leading-relaxed text-muted">
          {t('legal.terms.intro')}
        </p>
        <p className="mb-9 text-[13.5px] font-bold text-faint">{t('legal.terms.effective')}</p>

        <div className="flex flex-col gap-9">
          {sections.map((section, i) => (
            <Section key={section.title} n={String(i + 1)} section={section} />
          ))}
        </div>

        <LegalFooter exclude="terms" />
      </main>
    </div>
  )
}
