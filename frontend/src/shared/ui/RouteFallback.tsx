import { useTranslation } from 'react-i18next'

/**
 * Shown while a route's code is being fetched.
 *
 * Splitting the bundle per route means the code for a screen arrives when the screen is
 * opened, so there is a gap on a slow connection. A deliberate placeholder is better than
 * a blank page, which reads as a broken app.
 */
export function RouteFallback() {
  const { t } = useTranslation()

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-muted">{t('common.loading')}</p>
    </div>
  )
}
