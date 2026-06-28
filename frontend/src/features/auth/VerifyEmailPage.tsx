import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { verifyEmail } from '../../api/auth'
import { AuthShell } from '../../components/auth/AuthShell'

type Status = 'verifying' | 'success' | 'error'

export function VerifyEmailPage() {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const [status, setStatus] = useState<Status>('verifying')
  const ran = useRef(false)

  useEffect(() => {
    if (ran.current) return
    ran.current = true
    if (!token) {
      setStatus('error')
      return
    }
    verifyEmail(token)
      .then(() => setStatus('success'))
      .catch(() => setStatus('error'))
  }, [token])

  return (
    <AuthShell>
      <div className="mb-6">
        {status === 'verifying' && <p className="text-sm font-semibold text-muted">{t('auth.verifyVerifying')}</p>}
        {status === 'success' && (
          <p className="rounded-xl bg-success-soft px-4 py-3 text-sm font-semibold text-success-ink">
            {t('auth.verifySuccess')}
          </p>
        )}
        {status === 'error' && (
          <p className="rounded-xl bg-danger-soft px-4 py-3 text-sm font-semibold text-danger">
            {t('auth.verifyError')}
          </p>
        )}
      </div>

      <Link to={status === 'success' ? '/dashboard' : '/login'} className="btn-primary block w-full text-center">
        {status === 'success' ? t('auth.goToApp') : t('auth.backToLogin')}
      </Link>
    </AuthShell>
  )
}
