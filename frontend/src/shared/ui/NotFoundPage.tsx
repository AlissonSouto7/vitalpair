import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

/**
 * A real 404.
 *
 * Every unknown path used to redirect to the dashboard, which sends a logged-out visitor
 * to the login screen for no stated reason and quietly hides a broken link: a typo in a
 * URL looked exactly like a working one. Saying "this page does not exist" is both honest
 * and easier to debug.
 *
 * The way out is the system's primary button. It used to be `bg-primary` with white text, and
 * this palette has no `primary` token, so Tailwind emitted no rule at all: the label was white
 * on the page background, which in the light theme is white on cream. The only exit from the
 * screen was effectively invisible, and the "404" above it was unstyled for the same reason.
 */
export function NotFoundPage() {
  const { t } = useTranslation()

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="font-display text-6xl font-extrabold text-brand-ink">404</p>
      <h1 className="font-display text-2xl font-bold text-ink">{t('errors.notFound.title')}</h1>
      <p className="max-w-md font-semibold text-muted">{t('errors.notFound.description')}</p>
      <Link
        to="/"
        className="mt-2 rounded-xl bg-act px-6 py-3 font-extrabold text-on-fill transition hover:brightness-110"
      >
        {t('errors.notFound.backHome')}
      </Link>
    </div>
  )
}
