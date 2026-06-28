import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { ReactNode } from 'react'
import { useAuth } from '../hooks/useAuth'
import { BrandLockup } from './brand/BrandMark'
import { Avatar } from './ui/Avatar'
import { NotificationsBell } from './NotificationsBell'

/** Ícones SVG preenchidos (nada de emoji). 24x24, herdam currentColor. */
const ICONS: Record<string, ReactNode> = {
  home: <path d="M12 3 3 10v10a1 1 0 0 0 1 1h5v-6h6v6h5a1 1 0 0 0 1-1V10z" />,
  meal: <path d="M7 2v7a3 3 0 0 0 2 2.83V22h2V11.83A3 3 0 0 0 13 9V2h-2v6H9.5V2h-1.5v6H7zM17 2c-1.7 0-3 2.2-3 5 0 2.4 1 4.3 2 4.8V22h2V2z" />,
  activity: <path d="M13 2 4.5 13.5h5.5L9 22l8.5-12H12z" />,
  feed: <path d="M4 4h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H9l-5 4V6a2 2 0 0 1 2-2z" />,
  book: <path d="M5 3h11a3 3 0 0 1 3 3v15l-5-2.5L9 21V3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h0v-2H5z" />,
  dumbbell: <path d="M2 9h2v6H2zm3-1h2v8H5zm12 0h2v8h-2zm3 1h2v6h-2zM8 11h8v2H8z" />,
  flag: <path d="M5 2v20H3V2zm2 1h12l-3 4 3 4H7z" />,
  target: <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 4a6 6 0 1 1 0 12 6 6 0 0 1 0-12zm0 3a3 3 0 1 0 0 6 3 3 0 0 0 0-6z" />,
  medal: <path d="M8 2h8l-2 7H10zm4 8a6 6 0 1 0 0 12 6 6 0 0 0 0-12zm0 3 1.2 2.5 2.8.4-2 2 .5 2.8-2.5-1.3-2.5 1.3.5-2.8-2-2 2.8-.4z" />,
  chart: <path d="M3 3h2v18H3zm4 10h3v8H7zm5-6h3v14h-3zm5 3h3v11h-3z" />,
  heart: <path d="M12 21s-7-4.5-9.5-9A5 5 0 0 1 12 6a5 5 0 0 1 9.5 6c-2.5 4.5-9.5 9-9.5 9z" />,
  user: <path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5zm0 2c-4 0-8 2-8 5v3h16v-3c0-3-4-5-8-5z" />,
  gear: <path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm9 4-2.1-.6a7 7 0 0 0-.6-1.5l1.1-1.9-1.4-1.4-1.9 1.1a7 7 0 0 0-1.5-.6L14 3h-2l-.6 2.1a7 7 0 0 0-1.5.6L8 4.6 6.6 6l1.1 1.9a7 7 0 0 0-.6 1.5L5 10v4l2.1.6a7 7 0 0 0 .6 1.5L6.6 18 8 19.4l1.9-1.1a7 7 0 0 0 1.5.6L12 21h2l.6-2.1a7 7 0 0 0 1.5-.6l1.9 1.1 1.4-1.4-1.1-1.9a7 7 0 0 0 .6-1.5L21 14z" />,
}

const NAV = [
  { to: '/dashboard', label: 'nav.dashboard', icon: 'home' },
  { to: '/nutrition', label: 'nav.log', icon: 'meal' },
  { to: '/activity', label: 'nav.activity', icon: 'activity' },
  { to: '/feed', label: 'nav.feed', icon: 'feed' },
  { to: '/meal-plan', label: 'nav.mealPlan', icon: 'book' },
  { to: '/workout-plan', label: 'nav.workout', icon: 'dumbbell' },
  { to: '/season', label: 'nav.season', icon: 'flag' },
  { to: '/missions', label: 'nav.missions', icon: 'target' },
  { to: '/gamification', label: 'nav.achievements', icon: 'medal' },
  { to: '/progress', label: 'nav.progress', icon: 'chart' },
  { to: '/pair', label: 'nav.relationship', icon: 'heart' },
  { to: '/profile', label: 'nav.profile', icon: 'user' },
] as const

function NavIcon({ name }: { name: string }) {
  return (
    <svg viewBox="0 0 24 24" width={20} height={20} fill="currentColor" aria-hidden="true">
      {ICONS[name]}
    </svg>
  )
}

export function Layout() {
  const { t } = useTranslation()
  const { logout } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  const navLinks = NAV.map((item) => (
    <NavLink
      key={item.to}
      to={item.to}
      className={({ isActive }) =>
        `flex items-center gap-3 whitespace-nowrap rounded-xl px-3 py-2.5 text-sm font-bold transition ${
          isActive ? 'bg-brand-soft text-brand-ink' : 'text-muted hover:bg-surface hover:text-ink'
        }`
      }
    >
      <NavIcon name={item.icon} />
      {t(item.label)}
    </NavLink>
  ))

  return (
    <div className="flex min-h-screen bg-canvas">
      {/* Sidebar desktop */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-hair bg-sidebar px-4 py-5 md:flex">
        <div className="px-2">
          <BrandLockup size={36} />
        </div>

        <nav className="mt-6 flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto">{navLinks}</nav>

        <div className="mt-4 space-y-3 border-t border-hair pt-4">
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold transition ${
                isActive ? 'bg-brand-soft text-brand-ink' : 'text-muted hover:bg-surface hover:text-ink'
              }`
            }
          >
            <NavIcon name="gear" />
            {t('nav.settings')}
          </NavLink>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl bg-surface px-3 py-2.5 text-left transition hover:bg-track"
          >
            <Avatar initial="A" tone="you" size={36} />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-extrabold text-ink">{t('nav.logout')}</span>
              <span className="block truncate text-xs text-muted">VitalPair</span>
            </span>
          </button>
        </div>
      </aside>

      {/* Navbar do topo: sino à direita (marca só no mobile, desktop tem a sidebar) */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-hair bg-sidebar/90 px-4 py-3 backdrop-blur">
          <div className="md:hidden">
            <BrandLockup size={30} />
          </div>
          <div className="ml-auto flex items-center">
            <NotificationsBell />
          </div>
        </header>
        <nav className="flex gap-1 overflow-x-auto border-b border-hair bg-sidebar px-3 py-2 md:hidden">
          {navLinks}
        </nav>

        <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-6 md:px-8 md:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
