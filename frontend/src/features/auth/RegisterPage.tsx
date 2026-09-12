import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Link, useSearchParams } from 'react-router-dom'
import { z } from 'zod'

import { AuthShell } from '@/components/auth/AuthShell'
import { GoogleLoginButton } from '@/components/GoogleLoginButton'
import { PENDING_INVITE_KEY } from '@/features/pair/pendingInvite'
import { useAuth } from '@/hooks/useAuth'
import { getApiErrorMessage } from '@/shared/api/errors'
import { FormError } from '@/shared/ui/form/FormError'
import { TextField } from '@/shared/ui/form/TextField'

/**
 * Mirrors the backend's RegisterRequest: name and password have the same bounds it
 * enforces, so a person is told here rather than after a round trip. The server validates
 * regardless; this schema is about the message, not the guarantee.
 */
const schema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().min(1).email(),
  password: z.string().min(8).max(100),
})

type RegisterForm = z.infer<typeof schema>

function strength(pw: string): number {
  let s = 0
  if (pw.length >= 8) s++
  if (pw.length >= 12) s++
  if (/[0-9]/.test(pw) && /[a-zA-Z]/.test(pw)) s++
  if (/[^a-zA-Z0-9]/.test(pw)) s++
  return s
}

export function RegisterPage() {
  const { t } = useTranslation()
  const { register: createAccount } = useAuth()
  const [params] = useSearchParams()
  const invite = params.get('invite')
  const [error, setError] = useState<string | null>(null)
  // O endereço para o qual o e-mail saiu, ou null enquanto o formulário está aberto.
  const [submittedTo, setSubmittedTo] = useState<string | null>(null)

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({
    resolver: zodResolver(schema),
    mode: 'onTouched',
    defaultValues: { name: '', email: '', password: '' },
  })

  // useWatch rather than watch: the latter reads through a closure the React Compiler
  // cannot see into, so it skips compiling the component and says so on every lint run.
  const password = useWatch({ control, name: 'password' })
  const score = strength(password)

  async function onSubmit(values: RegisterForm) {
    setError(null)
    try {
      await createAccount(values)
      // Nenhuma sessão vem daqui: a conta nasce sem confirmação e o link do e-mail é que a
      // ativa, o que é o que permite ao cadastro responder igual para um e-mail que já tem
      // conta. O convite, quando existe, fica guardado e é usado no primeiro acesso.
      if (invite) {
        try {
          sessionStorage.setItem(PENDING_INVITE_KEY, invite.trim().toUpperCase())
        } catch {
          // Site data blocked: the person can still enter the code on the pair screen.
        }
      }
      setSubmittedTo(values.email)
    } catch (err) {
      setError(getApiErrorMessage(err, t('auth.errorRegister')))
    }
  }

  // Uma tela só, e deliberadamente a mesma para e-mail novo e para e-mail que já tem
  // conta: a diferença acontece na caixa de entrada, que só o dono lê.
  if (submittedTo) {
    return (
      <AuthShell>
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-soft">
          <svg viewBox="0 0 24 24" className="h-7 w-7 fill-brand" aria-hidden="true">
            <path d="M2 6.5A2.5 2.5 0 014.5 4h15A2.5 2.5 0 0122 6.5v11a2.5 2.5 0 01-2.5 2.5h-15A2.5 2.5 0 012 17.5v-11zm2.4-.5L12 12l7.6-6H4.4z" />
          </svg>
        </div>
        <h1 className="mb-1.5 text-center font-display text-[26px] font-semibold tracking-tight text-ink">
          {t('auth.checkEmailTitle')}
        </h1>
        <p className="mb-2 text-center text-sm font-semibold text-muted">
          {t('auth.checkEmailText', { email: submittedTo })}
        </p>
        <p className="mb-6 text-center text-[13px] font-semibold text-faint">
          {t('auth.checkEmailHint')}
        </p>
        <Link to="/login" className="btn-primary w-full justify-center">
          {t('auth.checkEmailCta')}
        </Link>
      </AuthShell>
    )
  }

  return (
    <AuthShell>
      <h1 className="mb-1.5 font-display text-[28px] font-semibold tracking-tight text-ink">
        {t('auth.registerTitle')}
      </h1>
      <p className="mb-6 text-sm font-semibold text-muted">{t('auth.registerSubtitle')}</p>

      {invite && (
        <p className="mb-4 rounded-xl bg-rival-soft px-4 py-2.5 text-sm font-bold text-rival-ink">
          {t('auth.registerInviteHint')}
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
          label={t('auth.nameLabel')}
          type="text"
          autoComplete="name"
          error={errors.name && t('auth.nameRequired')}
          {...register('name')}
        />
        <TextField
          label={t('auth.email')}
          type="email"
          autoComplete="email"
          error={errors.email && t('auth.invalidEmail')}
          {...register('email')}
        />
        <div>
          <TextField
            label={t('auth.password')}
            type="password"
            autoComplete="new-password"
            error={errors.password && t('auth.passwordTooShort')}
            {...register('password')}
          />
          <div className="mt-2 flex gap-1.5" aria-hidden="true">
            {[0, 1, 2, 3].map((i) => (
              <span
                key={i}
                className={`h-1 flex-1 rounded-full transition-colors ${i < score ? 'bg-success' : 'bg-track'}`}
              />
            ))}
          </div>
        </div>

        <FormError message={error} />

        <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
          {isSubmitting ? t('auth.creating') : t('auth.createAccountCta')}
        </button>
      </form>

      <p className="mt-5 text-center text-sm font-semibold text-muted">
        {t('auth.alreadyMember')}{' '}
        <Link to="/login" className="font-extrabold text-brand-ink hover:underline">
          {t('auth.goToLogin')}
        </Link>
      </p>
    </AuthShell>
  )
}
