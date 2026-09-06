import type { ReactNode } from 'react'
import { ErrorBoundary } from 'react-error-boundary'
import { useTranslation } from 'react-i18next'

import { getRequestId } from '@/shared/api/errors'

function Fallback({
  error,
  resetErrorBoundary,
}: {
  error: unknown
  resetErrorBoundary: () => void
}) {
  const { t } = useTranslation()
  const requestId = getRequestId(error)

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-2xl font-bold">{t('errors.errorBoundary.title')}</h1>
      <p className="max-w-md text-muted">{t('errors.errorBoundary.description')}</p>
      {requestId && (
        <p className="text-xs text-muted">
          {t('errors.errorBoundary.requestId')}: <code className="font-mono">{requestId}</code>
        </p>
      )}
      <button
        type="button"
        onClick={resetErrorBoundary}
        className="mt-2 rounded-xl bg-primary px-6 py-3 font-bold text-white transition hover:opacity-90"
      >
        {t('errors.errorBoundary.retry')}
      </button>
    </div>
  )
}

/**
 * Catches a rendering error instead of leaving a blank page.
 *
 * React unmounts the whole tree when a render throws, so without a boundary one bad value
 * from the API turned the application into a white screen with the reason only in the
 * console. The request id is shown when the error carries one, so a report from a user
 * points straight at the server log.
 */
export function AppErrorBoundary({ children }: { children: ReactNode }) {
  return <ErrorBoundary FallbackComponent={Fallback}>{children}</ErrorBoundary>
}
