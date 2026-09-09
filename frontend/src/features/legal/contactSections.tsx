import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import { MAIL } from './contactDetails'

/**
 * What sits beside the contact form: how else to reach us, and the questions asked most.
 *
 * Moved out of ContactPage verbatim, markup untouched.
 */

export function SideInfo() {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-3xl border border-arena-border bg-arena p-6 shadow-[0_20px_50px_var(--arena-shadow)]">
        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-brand">
          <svg viewBox="0 0 24 24" className="h-[22px] w-[22px] fill-white" aria-hidden="true">
            <path d="M4 4h16a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2zm0 3.2V6l8 5 8-5v1.2l-8 5z" />
          </svg>
        </div>
        <div className="mb-1 text-[11px] font-extrabold tracking-[0.12em] text-arena-muted">
          {t('legal.contact.directEmail')}
        </div>
        <a
          href={`mailto:${MAIL}`}
          className="cursor-pointer font-display text-[19px] font-semibold text-arena-text underline decoration-transparent underline-offset-2 transition hover:decoration-brand"
        >
          {MAIL}
        </a>
        <p className="mt-3 text-[13px] font-semibold leading-relaxed text-arena-muted">
          {t('legal.contact.directEmailText')}
        </p>
      </div>

      <div className="rounded-3xl border border-hair bg-surface p-6">
        <div className="mb-1 flex items-center gap-2 text-[13px] font-extrabold text-ink">
          <svg viewBox="0 0 24 24" className="h-4 w-4 fill-success" aria-hidden="true">
            <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm1 5h-2v6l5 3 1-1.7-4-2.3z" />
          </svg>
          {t('legal.contact.responseTime')}
        </div>
        <p className="text-[13px] font-semibold leading-relaxed text-muted">
          {t('legal.contact.responseTimeText')}
        </p>
      </div>
    </div>
  )
}

/* ===================== FAQ ===================== */

export function Faq() {
  const { t } = useTranslation()

  const photoAnswer = t('legal.contact.faqPhotoA')
  const photoLink = t('legal.contact.faqPhotoLink')
  // O texto cita "Política de Privacidade"; transformamos essa parte num link.
  const photoNode: ReactNode = photoAnswer.includes(photoLink)
    ? (() => {
        const [before, after] = photoAnswer.split(photoLink)
        return (
          <>
            {before}
            <Link
              to="/privacidade"
              className="cursor-pointer font-extrabold text-brand-ink underline decoration-brand/40 underline-offset-2 transition hover:decoration-brand"
            >
              {photoLink}
            </Link>
            {after}
          </>
        )
      })()
    : photoAnswer

  const deleteAnswer = t('legal.contact.faqDeleteA')
  const deleteNode: ReactNode = deleteAnswer.includes('{{mail}}')
    ? (() => {
        const [before, after] = deleteAnswer.split('{{mail}}')
        return (
          <>
            {before}
            <a
              href={`mailto:${MAIL}`}
              className="cursor-pointer font-extrabold text-brand-ink underline decoration-brand/40 underline-offset-2 transition hover:decoration-brand"
            >
              {MAIL}
            </a>
            {after}
          </>
        )
      })()
    : deleteAnswer

  const items: [string, ReactNode][] = [
    [t('legal.contact.faqFreeQ'), t('legal.contact.faqFreeA')],
    [t('legal.contact.faqPhotoQ'), photoNode],
    [t('legal.contact.faqDeleteQ'), deleteNode],
  ]

  return (
    <section className="mt-12">
      <h2 className="mb-5 font-display text-[24px] font-semibold tracking-[-0.01em] text-ink">
        {t('legal.contact.faqTitle')}
      </h2>
      <div className="flex flex-col gap-3">
        {items.map(([q, a]) => (
          <div key={q} className="rounded-2xl border border-hair bg-surface p-5">
            <h3 className="mb-1.5 flex items-start gap-2.5 font-display text-[16px] font-semibold text-ink">
              <svg
                viewBox="0 0 24 24"
                className="mt-0.5 h-4 w-4 flex-shrink-0 fill-brand"
                aria-hidden="true"
              >
                <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm0 15.5a1.3 1.3 0 110 2.6 1.3 1.3 0 010-2.6zm1.6-4.4c-.6.5-.6.6-.6 1.4h-2c0-1.4.3-2 1.2-2.7.7-.6 1-.9 1-1.6a1.2 1.2 0 00-2.4-.1H8.8a3.2 3.2 0 116.4.1c0 1.3-.5 1.9-1.6 2.5z" />
              </svg>
              {q}
            </h3>
            <p className="pl-[26px] text-[14px] font-semibold leading-relaxed text-muted">{a}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
