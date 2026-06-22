import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useTheme } from '../hooks/useTheme'

const NAV = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/nutrition', label: 'Refeições' },
  { to: '/activity', label: 'Atividade' },
  { to: '/feed', label: 'Feed' },
  { to: '/pair', label: 'Relação' },
  { to: '/gamification', label: 'Conquistas' },
  { to: '/profile', label: 'Perfil' },
]

export function Layout() {
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
            <span className="text-lg font-extrabold tracking-tight">
              Vita<span className="text-accent">Pair</span>
            </span>
            <nav className="flex gap-1 text-sm">
              {NAV.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `whitespace-nowrap rounded-lg px-3 py-1.5 transition ${
                      isActive ? 'bg-lime-400/10 font-semibold text-accent' : 'text-muted hover:text-ink'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={toggle}
              title={theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
              className="rounded-lg border border-line px-2 py-1.5 text-base leading-none text-muted transition hover:text-ink"
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
            <button onClick={handleLogout} className="whitespace-nowrap text-sm font-medium text-muted transition hover:text-red-500">
              Sair
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
