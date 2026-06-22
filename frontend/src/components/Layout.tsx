import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../hooks/useAuth'
import { useTheme } from '../hooks/useTheme'
import { NotificationsBell } from './NotificationsBell'
import { LanguageSelect } from './LanguageSelect'

const NAV = [
  { to: '/dashboard', key: 'dashboard', icon: '📊' },
  { to: '/nutrition', key: 'nutrition', icon: '🍽️' },
  { to: '/activity', key: 'activity', icon: '🏃' },
  { to: '/feed', key: 'feed', icon: '📣' },
  { to: '/pair', key: 'relationship', icon: '💞' },
  { to: '/gamification', key: 'achievements', icon: '🏆' },
  { to: '/profile', key: 'profile', icon: '👤' },
] as const

export function Layout() {
  const { t } = useTranslation()
  const { logout } = useAuth()
  const { theme, toggle } = useTheme()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  return (
    <div className="min-h-full">
      <header className="sticky top-0 z-10 border-b border-line bg-bg/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-6 overflow-x-auto">
            <span className="shrink-0 text-lg font-extrabold tracking-tight">
              Vita<span className="text-accent">Pair</span>
            </span>
            <nav className="flex gap-1 text-sm">
              {NAV.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 transition ${
                      isActive ? 'bg-lime-400/10 font-semibold text-accent' : 'text-muted hover:text-ink'
                    }`
                  }
                >
                  <span className="text-xs">{item.icon}</span>
                  {t(`nav.${item.key}`)}
                </NavLink>
              ))}
            </nav>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <LanguageSelect />
            <NotificationsBell />
            <button
              onClick={toggle}
              title={theme === 'dark' ? t('header.light') : t('header.dark')}
              className="rounded-lg border border-line px-2 py-1.5 text-base leading-none text-muted transition hover:text-ink"
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
            <button
              onClick={handleLogout}
              title={t('header.logout')}
              className="whitespace-nowrap rounded-lg border border-line px-2 py-1.5 text-sm font-medium text-muted transition hover:border-red-500/40 hover:text-red-500"
            >
              {t('header.logout')}
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
