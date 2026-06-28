import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { forgotPassword } from '../../api/auth'
import { AuthShell } from '../../components/auth/AuthShell'

export function ForgotPasswordPage() {
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await forgotPassword(email)
      setSent(true)
    } catch {
      setError(t('auth.errorForgot'))
    } finally {
      setLoading(false)
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
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">{t('auth.email')}</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="input" />
          </div>
          {error && <p className="rounded-xl bg-danger-soft px-3 py-2 text-sm font-semibold text-danger">{error}</p>}
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? t('auth.sending') : t('auth.forgotCta')}
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
