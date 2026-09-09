import { zodResolver } from '@hookform/resolvers/zod'
import { useState, type ReactNode } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'

import { MAIL } from './contactDetails'
import { openMailClient } from './mailto'

/** Mirrors what the mail client will be handed: a name, a reply address and a message. */
const schema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email(),
  message: z.string().trim().min(1).max(5000),
})

type ContactValues = z.infer<typeof schema>

/**
 * The form that hands the message to the visitor's mail client.
 *
 * Moved out of ContactPage verbatim, markup untouched. There is no endpoint behind it on
 * purpose: a public one that sends e-mail is a spam relay until it has rate limiting and a
 * challenge in front of it, and mailto: means the message actually leaves.
 */

export function ContactForm() {
  const { t } = useTranslation()
  const [sent, setSent] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactValues>({
    resolver: zodResolver(schema),
    mode: 'onTouched',
  })

  function onSubmit(values: ContactValues) {
    const subject = `VitalPair · ${values.name}`
    const body = `${values.message}\n\n${values.name} <${values.email}>`
    openMailClient(
      `mailto:${MAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`,
    )
    reset()
    setSent(true)
  }

  if (sent) {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl border border-success/30 bg-success-soft p-8 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success">
          <svg viewBox="0 0 24 24" className="h-8 w-8 fill-white" aria-hidden="true">
            <path d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z" />
          </svg>
        </div>
        <h2 className="mb-2 font-display text-[22px] font-semibold text-ink">
          {t('legal.contact.sentTitle')}
        </h2>
        <p className="mb-6 max-w-[340px] text-[14px] font-semibold leading-relaxed text-muted">
          {t('legal.contact.sentText', { mail: MAIL })}
        </p>
        <button
          type="button"
          onClick={() => setSent(false)}
          className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-hair bg-surface px-4 py-2.5 text-[13.5px] font-extrabold text-ink transition hover:border-brand"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
            <path d="M12 5V2L7 7l5 5V9a5 5 0 11-5 5H5a7 7 0 107-7z" />
          </svg>
          {t('legal.contact.sendAnother')}
        </button>
      </div>
    )
  }

  return (
    <form
      onSubmit={(event) => void handleSubmit(onSubmit)(event)}
      noValidate
      className="flex flex-col gap-4 rounded-3xl border border-hair bg-surface p-6 shadow-[0_10px_30px_rgba(70,45,20,0.06)]"
    >
      <Field
        id="contact-name"
        label={t('legal.contact.nameLabel')}
        icon="user"
        error={errors.name && t('legal.contact.nameRequired')}
      >
        <input
          id="contact-name"
          type="text"
          autoComplete="name"
          aria-invalid={errors.name ? true : undefined}
          aria-describedby={errors.name ? 'contact-name-error' : undefined}
          placeholder={t('legal.contact.namePlaceholder')}
          className="w-full rounded-xl border border-hair bg-canvas px-3.5 py-2.5 text-[15px] font-semibold text-ink placeholder-faint outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/30"
          {...register('name')}
        />
      </Field>

      <Field
        id="contact-email"
        label={t('legal.contact.emailLabel')}
        icon="mail"
        error={errors.email && t('legal.contact.emailInvalid')}
      >
        <input
          id="contact-email"
          type="email"
          autoComplete="email"
          aria-invalid={errors.email ? true : undefined}
          aria-describedby={errors.email ? 'contact-email-error' : undefined}
          placeholder={t('legal.contact.emailPlaceholder')}
          className="w-full rounded-xl border border-hair bg-canvas px-3.5 py-2.5 text-[15px] font-semibold text-ink placeholder-faint outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/30"
          {...register('email')}
        />
      </Field>

      <Field
        id="contact-message"
        label={t('legal.contact.messageLabel')}
        icon="chat"
        error={errors.message && t('legal.contact.messageRequired')}
      >
        <textarea
          id="contact-message"
          rows={5}
          aria-invalid={errors.message ? true : undefined}
          aria-describedby={errors.message ? 'contact-message-error' : undefined}
          placeholder={t('legal.contact.messagePlaceholder')}
          className="w-full resize-y rounded-xl border border-hair bg-canvas px-3.5 py-2.5 text-[15px] font-semibold leading-relaxed text-ink placeholder-faint outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/30"
          {...register('message')}
        />
      </Field>

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-1 inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-brand px-5 py-3 text-[15px] font-extrabold text-white transition hover:brightness-105"
      >
        <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] fill-white" aria-hidden="true">
          <path d="M2 21l21-9L2 3v7l15 2-15 2z" />
        </svg>
        {t('legal.contact.submit')}
      </button>

      <p className="text-center text-[12px] font-bold text-faint">
        {t('legal.contact.privacyNote')}
      </p>
    </form>
  )
}

export function Field({
  id,
  label,
  icon,
  error,
  children,
}: {
  id: string
  label: string
  icon: 'user' | 'mail' | 'chat'
  /** Validation message for this field, already translated. */
  error?: string
  children: ReactNode
}) {
  const path = {
    user: 'M12 12a5 5 0 100-10 5 5 0 000 10zm-8 9c0-4 3.6-6 8-6s8 2 8 6v1H4z',
    mail: 'M4 4h16a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2zm0 3.2V6l8 5 8-5v1.2l-8 5z',
    chat: 'M4 3h16a2 2 0 012 2v10a2 2 0 01-2 2H8l-5 4V5a2 2 0 011-2z',
  }[icon]

  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1.5 flex items-center gap-2 text-[13px] font-extrabold text-ink"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-muted" aria-hidden="true">
          <path d={path} />
        </svg>
        {label}
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} role="alert" className="mt-1 text-xs font-semibold text-danger">
          {error}
        </p>
      )}
    </div>
  )
}
