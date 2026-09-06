import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

/**
 * A real 404.
 *
 * Every unknown path used to redirect to the dashboard, which sends a logged-out visitor
 * to the login screen for no stated reason and quietly hides a broken link: a typo in a
 * URL looked exactly like a working one. Saying "this page does not exist" is both honest
 * and easier to debug.
 */
export function NotFoundPage() {
  const { t } = useTranslation()

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-6xl font-extrabold text-primary">404</p>
      <h1 className="text-2xl font-bold">{t('errors.notFound.title')}</h1>
      <p className="max-w-md text-muted">{t('errors.notFound.description')}</p>
      <Link
        to="/"
        className="mt-2 rounded-xl bg-primary px-6 py-3 font-bold text-white transition hover:opacity-90"
      >
        {t('errors.notFound.backHome')}
      </Link>
    </div>
  )
}
