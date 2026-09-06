import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { z } from 'zod'

import { joinPair } from '@/api/pair'
import { AuthShell } from '@/components/auth/AuthShell'
import { GoogleLoginButton } from '@/components/GoogleLoginButton'
import { useAuth } from '@/hooks/useAuth'
import { getApiErrorMessage } from '@/shared/api/errors'
import { FormError } from '@/shared/ui/form/FormError'
import { TextField } from '@/shared/ui/form/TextField'

/**
 * The shape the form guarantees before anything is sent.
 *
 * The browser's own `required` and `type="email"` are a convenience, not a guard: they are
 * bypassed trivially and their messages are the browser's, in the browser's language,
 * which on a Portuguese page in an English browser reads as a bug. The backend validates
 * regardless; this is about telling the person what is wrong before a round trip.
 */
const schema = z.object({
  email: z.string().min(1).email(),
  password: z.string().min(1),
})

type LoginForm = z.infer<typeof schema>

export function LoginPage() {
  const { t } = useTranslation()
  const { login } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const invite = params.get('convite')
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(schema),
    // Validate when the field loses focus rather than on every keystroke: telling someone
    // their e-mail is invalid while they are still typing the first letter is noise.
    mode: 'onTouched',
  })

  async function onSubmit(values: LoginForm) {
    setError(null)
    try {
      await login(values)
      if (invite) {
        await joinPair(invite.trim().toUpperCase()).catch(() => undefined)
      }
      navigate('/dashboard')
    } catch (err) {
      setError(getApiErrorMessage(err, t('auth.errorLogin')))
    }
  }

  return (
    <AuthShell>
      <h1 className="mb-1.5 font-display text-[28px] font-semibold tracking-tight text-ink">
        {t('auth.loginTitle')}
      </h1>
      <p className="mb-6 text-sm font-semibold text-muted">{t('auth.loginSubtitle')}</p>

      {invite && (
        <p className="mb-4 rounded-xl bg-rival-soft px-4 py-2.5 text-sm font-bold text-rival-ink">
          {t('auth.loginInviteHint')}
        </p>
      )}

      <div className="mb-4 flex justify-center">
        <GoogleLoginButton onError={setError} />
      </div>

      <div className="mb-4 flex items-center gap-3">
        <span className="h-px flex-1 bg-hair" />
        <span className="text-[11px] font-bold text-muted">{t('auth.orWithEmail')}</span>
        <span className="h-px flex-1 bg-hair" />
      </div>

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
        <TextField
          label={t('auth.password')}
          type="password"
          autoComplete="current-password"
          error={errors.password && t('auth.passwordRequired')}
          action={
            <Link
              to="/forgot-password"
              className="text-xs font-extrabold text-brand-ink hover:underline"
            >
              {t('auth.forgotShort')}
            </Link>
          }
          {...register('password')}
        />

        <FormError message={error} />

        <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
          {isSubmitting ? t('auth.signingIn') : t('auth.signIn')}
        </button>
      </form>

      <p className="mt-5 text-center text-sm font-semibold text-muted">
        {t('auth.noAccount')}{' '}
        <Link to="/register" className="font-extrabold text-brand-ink hover:underline">
          {t('auth.createOne')}
        </Link>
      </p>
    </AuthShell>
  )
}
