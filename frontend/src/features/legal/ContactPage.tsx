import { useTranslation } from 'react-i18next'

import { ContactForm } from './ContactForm'
import { Faq, SideInfo } from './contactSections'
import { LegalHeader, LegalFooter } from './PrivacyPage'

import { useLegalNamespace } from '@/shared/i18n/useLegalNamespace'
import { RouteFallback } from '@/shared/ui/RouteFallback'

/**
 * The contact page. Standalone, outside the app shell, with its own scroll.
 *
 * There is no endpoint that receives contact messages, and a public one that sends e-mail
 * is a spam relay until it has rate limiting and a challenge in front of it. Until then
 * the form hands the message to the visitor's own mail client: it actually leaves, and no
 * server of ours can be abused to send it. Before this the form showed "message received"
 * for a message that was read nowhere.
 */
export function ContactPage() {
  // The legal texts are not in the main bundle; rendering before they arrive
  // would show raw translation keys.
  const legalReady = useLegalNamespace()
  const { t } = useTranslation()

  if (!legalReady) return <RouteFallback />
  return (
    <div className="min-h-screen bg-canvas text-ink">
      <LegalHeader />

      <main className="mx-auto max-w-[760px] px-5 pb-20 pt-6 sm:px-8">
        <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-success-soft px-3.5 py-1.5 text-xs font-extrabold text-success-ink">
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-success" aria-hidden="true">
            <path d="M4 4h16a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2zm0 3.2V6l8 5 8-5v1.2l-8 5z" />
          </svg>
          {t('legal.contact.badge')}
        </span>

        <h1 className="mb-3 font-display text-[34px] font-semibold leading-[1.05] tracking-[-0.02em] text-ink sm:text-[42px]">
          {t('legal.contact.title')}
        </h1>
        <p className="mb-9 max-w-[520px] text-base font-semibold leading-relaxed text-muted">
          {t('legal.contact.intro')}
        </p>

        <div className="grid gap-6 lg:grid-cols-[1fr_.85fr]">
          <ContactForm />
          <SideInfo />
        </div>

        <Faq />

        <LegalFooter exclude="contact" />
      </main>
    </div>
  )
}

/* ===================== formulário ===================== */
