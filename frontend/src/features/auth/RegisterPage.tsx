import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { AxiosError } from 'axios'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../hooks/useAuth'
import { joinPair } from '../../api/pair'
import { GoogleLoginButton } from '../../components/GoogleLoginButton'
import { AuthShell } from '../../components/auth/AuthShell'

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
  const { register } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const invite = params.get('convite')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const score = strength(password)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await register({ name, email, password })
      if (invite) {
        // Veio de um convite: entra na dupla antes de seguir pro onboarding.
        await joinPair(invite.trim().toUpperCase()).catch(() => undefined)
      }
      navigate('/onboarding')
    } catch (err) {
      const message = err instanceof AxiosError ? err.response?.data?.message : null
      setError(message ?? t('auth.errorRegister'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell>
      <h1 className="mb-1.5 font-display text-[28px] font-semibold tracking-tight text-ink">{t('auth.registerTitle')}</h1>
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

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">{t('auth.nameLabel')}</label>
          <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="input" />
        </div>
        <div>
          <label className="label">{t('auth.email')}</label>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="input" />
        </div>
        <div>
          <label className="label">{t('auth.password')}</label>
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input"
          />
          <div className="mt-2 flex gap-1.5">
            {[0, 1, 2, 3].map((i) => (
              <span
                key={i}
                className={`h-1 flex-1 rounded-full transition-colors ${i < score ? 'bg-success' : 'bg-track'}`}
              />
            ))}
          </div>
        </div>

        {error && <p className="rounded-xl bg-danger-soft px-3 py-2 text-sm font-semibold text-danger">{error}</p>}

        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? t('auth.creating') : t('auth.createAccountCta')}
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
