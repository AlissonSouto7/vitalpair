import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { z } from 'zod'

import { forgotPassword } from '@/api/auth'
import { AuthShell } from '@/components/auth/AuthShell'
import { FormError } from '@/shared/ui/form/FormError'
import { TextField } from '@/shared/ui/form/TextField'

const schema = z.object({ email: z.string().min(1).email() })

type ForgotForm = z.infer<typeof schema>

export function ForgotPasswordPage() {
  const { t } = useTranslation()
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotForm>({ resolver: zodResolver(schema), mode: 'onTouched' })

  async function onSubmit(values: ForgotForm) {
    setError(null)
    try {
      await forgotPassword(values.email)
      setSent(true)
    } catch {
      setError(t('auth.errorForgot'))
    }
  }

  return (
    <AuthShell>
      <h1 className="mb-1.5 font-display text-[28px] font-semibold tracking-tight text-ink">
        {t('auth.forgotPassword')}
      </h1>
      <p className="mb-6 text-sm font-semibold text-muted">{t('auth.forgotTagline')}</p>

      {sent ? (
        <p className="rounded-xl bg-success-soft px-4 py-3 text-sm font-semibold text-success-ink">
          {t('auth.forgotSent')}
        </p>
      ) : (
        <form
          onSubmit={(event) => void handleSubmit(onSubmit)(event)}
          className="space-y-4"
          noValidate
        >
          <TextField
            label={t('auth.email')}
            type="email"
            autoComplete="email"
            error={errors.email && t('auth.invalidEmail')}
            {...register('email')}
          />
          <FormError message={error} />
          <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
            {isSubmitting ? t('auth.sending') : t('auth.forgotCta')}
          </button>
        </form>
      )}

      <p className="mt-5 text-center text-sm font-semibold text-muted">
        <Link to="/login" className="font-extrabold text-brand-ink hover:underline">
          {t('auth.backToLogin')}
        </Link>
      </p>
    </AuthShell>
  )
}
