import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { AxiosError } from 'axios'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../hooks/useAuth'
import { joinPair } from '../../api/pair'
import { GoogleLoginButton } from '../../components/GoogleLoginButton'
import { AuthShell } from '../../components/auth/AuthShell'

export function LoginPage() {
  const { t } = useTranslation()
  const { login } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const invite = params.get('convite')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await login({ email, password })
      if (invite) {
        await joinPair(invite.trim().toUpperCase()).catch(() => undefined)
      }
      navigate('/dashboard')
    } catch (err) {
      const message = err instanceof AxiosError ? err.response?.data?.message : null
      setError(message ?? t('auth.errorLogin'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell>
      <h1 className="mb-1.5 font-display text-[28px] font-semibold tracking-tight text-ink">{t('auth.loginTitle')}</h1>
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

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">{t('auth.email')}</label>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="input" />
        </div>
        <div>
          <div className="mb-1 flex items-center justify-between">
            <label className="label mb-0">{t('auth.password')}</label>
            <Link to="/forgot-password" className="text-xs font-extrabold text-brand-ink hover:underline">
              {t('auth.forgotShort')}
            </Link>
          </div>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input"
          />
        </div>

        {error && <p className="rounded-xl bg-danger-soft px-3 py-2 text-sm font-semibold text-danger">{error}</p>}

        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? t('auth.signingIn') : t('auth.signIn')}
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
