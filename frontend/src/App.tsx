import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { bootstrapSession } from './api/client'
import { AppRouter } from './router/AppRouter'
import { useAuthStore } from './store/authStore'

export default function App() {
  const { t } = useTranslation()
  const bootstrapped = useAuthStore((s) => s.bootstrapped)

  // The access token is kept in memory, so every reload starts without one. The refresh
  // cookie survives, and this exchanges it for a fresh access token. Without it a logged-in
  // user would be bounced to the login page on every refresh.
  useEffect(() => {
    void bootstrapSession()
  }, [])

  // Routing before the answer arrives would send a logged-in user to /login for a moment,
  // so the app waits. This is one request against localhost or the same origin.
  if (!bootstrapped) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted">{t('common.loading')}</p>
      </div>
    )
  }

  return <AppRouter />
}
