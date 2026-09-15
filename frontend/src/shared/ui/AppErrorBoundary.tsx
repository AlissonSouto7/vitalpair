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
      <h1 className="font-display text-2xl font-bold text-ink">
        {t('errors.errorBoundary.title')}
      </h1>
      <p className="max-w-md font-semibold text-muted">{t('errors.errorBoundary.description')}</p>
      {requestId && (
        <p className="text-xs text-muted">
          {t('errors.errorBoundary.requestId')}: <code className="font-mono">{requestId}</code>
        </p>
      )}
      {/*
        The retry was `bg-primary` with white text, and this palette has no `primary` token, so
        Tailwind emitted nothing: the only way out of the error screen was a white label on the
        page background. Same bug as the 404's exit had.
      */}
      <button
        type="button"
        onClick={resetErrorBoundary}
        className="mt-2 rounded-xl bg-brand px-6 py-3 font-extrabold text-on-fill transition hover:brightness-105"
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
