import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { resetPassword } from '../../api/auth'
import { AuthShell } from '../../components/auth/AuthShell'

export function ResetPasswordPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''

  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    if (!token) {
      setError(t('auth.resetMissingToken'))
      return
    }
    setLoading(true)
    try {
      await resetPassword(token, password)
      setDone(true)
      setTimeout(() => navigate('/login'), 2500)
    } catch {
      setError(t('auth.errorReset'))
    } finally {
      setLoading(false)
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
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">{t('auth.newPassword')}</label>
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
          {error && (
            <p className="rounded-xl bg-danger-soft px-3 py-2 text-sm font-semibold text-danger">
              {error}
            </p>
          )}
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? t('auth.resetting') : t('auth.resetCta')}
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
