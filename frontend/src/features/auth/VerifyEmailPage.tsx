import { useQuery } from '@tanstack/react-query'
import { Link, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { verifyEmail } from '../../api/auth'
import { AuthShell } from '../../components/auth/AuthShell'

type Status = 'verifying' | 'success' | 'error'

export function VerifyEmailPage() {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''

  /**
   * Spends the token from the e-mail link.
   *
   * A query rather than an effect, and the difference matters here more than on a screen
   * that only reads: the token is single use, and React's strict mode mounts twice in
   * development, so the effect version needed a ref to stop the second run from burning it.
   * The query deduplicates by key, which is the same guarantee without the flag. Retrying
   * is off for the same reason: a second attempt would spend a token the first one
   * consumed and report a failure that did not happen.
   */
  const verification = useQuery({
    queryKey: ['auth', 'verify-email', token],
    queryFn: () => verifyEmail(token),
    enabled: token !== '',
    retry: false,
    staleTime: Infinity,
    gcTime: Infinity,
  })

  const status: Status =
    token === '' || verification.isError
      ? 'error'
      : verification.isSuccess
        ? 'success'
        : 'verifying'

  return (
    <AuthShell>
      <div className="mb-6">
        {status === 'verifying' && (
          <p className="text-sm font-semibold text-muted">{t('auth.verifyVerifying')}</p>
        )}
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

      <Link
        to={status === 'success' ? '/dashboard' : '/login'}
        className="btn-primary block w-full text-center"
      >
        {status === 'success' ? t('auth.goToApp') : t('auth.backToLogin')}
      </Link>
    </AuthShell>
  )
}
