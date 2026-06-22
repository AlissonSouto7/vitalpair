import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AxiosError } from 'axios'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../hooks/useAuth'
import { GoogleLoginButton } from '../../components/GoogleLoginButton'

export function RegisterPage() {
  const { t } = useTranslation()
  const { register } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await register({ name, email, password })
      navigate('/dashboard')
    } catch (err) {
      const message = err instanceof AxiosError ? err.response?.data?.message : null
      setError(message ?? t('auth.errorRegister'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="card w-full max-w-sm glow-lime">
        <h1 className="text-center text-3xl font-extrabold tracking-tight">
          Vita<span className="text-accent">Pair</span>
        </h1>
        <p className="mb-6 mt-1 text-center text-sm text-muted">{t('auth.registerTagline')}</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">{t('auth.name')}</label>
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
            <p className="mt-1 text-xs text-faint">{t('auth.minChars')}</p>
          </div>

          {error && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-500">{error}</p>}

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? t('auth.creating') : t('auth.createAccount')}
          </button>
        </form>

        <div className="my-5 flex items-center gap-3 text-xs text-faint">
          <span className="h-px flex-1 bg-surface2" />
          {t('common.or')}
          <span className="h-px flex-1 bg-surface2" />
        </div>

        <GoogleLoginButton onError={setError} />

        <p className="mt-6 text-center text-sm text-muted">
          {t('auth.haveAccount')}{' '}
          <Link to="/login" className="font-semibold text-accent hover:underline">
            {t('auth.signIn')}
          </Link>
        </p>
      </div>
    </div>
  )
}
