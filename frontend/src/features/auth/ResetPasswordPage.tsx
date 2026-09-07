import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { z } from 'zod'

import { resetPassword } from '@/api/auth'
import { AuthShell } from '@/components/auth/AuthShell'
import { FormError } from '@/shared/ui/form/FormError'
import { TextField } from '@/shared/ui/form/TextField'

/** Same bound the backend enforces on ResetPasswordRequest. */
const schema = z.object({ password: z.string().min(8).max(100) })

type ResetForm = z.infer<typeof schema>

export function ResetPasswordPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''

  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetForm>({ resolver: zodResolver(schema), mode: 'onTouched' })

  async function onSubmit(values: ResetForm) {
    setError(null)
    if (!token) {
      setError(t('auth.resetMissingToken'))
      return
    }
    try {
      await resetPassword(token, values.password)
      setDone(true)
      setTimeout(() => navigate('/login'), 2500)
    } catch {
      setError(t('auth.errorReset'))
    }
  }

  return (
    <AuthShell>
      <h1 className="mb-1.5 font-display text-[28px] font-semibold tracking-tight text-ink">
        {t('auth.newPassword')}
      </h1>
      <p className="mb-6 text-sm font-semibold text-muted">{t('auth.resetTagline')}</p>

      {done ? (
        <p className="rounded-xl bg-success-soft px-4 py-3 text-sm font-semibold text-success-ink">
          {t('auth.resetSuccess')}
        </p>
      ) : (
        <form
          onSubmit={(event) => void handleSubmit(onSubmit)(event)}
          className="space-y-4"
          noValidate
        >
          <div>
            <TextField
              label={t('auth.newPassword')}
              type="password"
              autoComplete="new-password"
              error={errors.password && t('auth.passwordTooShort')}
              {...register('password')}
            />
            <p className="mt-1 text-xs text-faint">{t('auth.minChars')}</p>
          </div>
          <FormError message={error} />
          <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
            {isSubmitting ? t('auth.resetting') : t('auth.resetCta')}
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
