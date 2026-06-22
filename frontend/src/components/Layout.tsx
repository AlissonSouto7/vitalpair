import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

const NAV = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/nutrition', label: 'Refeições' },
  { to: '/activity', label: 'Atividade' },
  { to: '/feed', label: 'Feed' },
  { to: '/pair', label: 'Par' },
  { to: '/gamification', label: 'Conquistas' },
  { to: '/profile', label: 'Perfil' },
]

export function Layout() {
  const { logout } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  return (
    <div className="min-h-full">
      <header className="sticky top-0 z-10 border-b border-slate-800 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-6 overflow-x-auto">
            <span className="text-lg font-extrabold tracking-tight">
              Vita<span className="text-lime-400">Pair</span>
            </span>
            <nav className="flex gap-1 text-sm">
              {NAV.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `whitespace-nowrap rounded-lg px-3 py-1.5 transition ${
                      isActive
                        ? 'bg-lime-400/10 font-semibold text-lime-400'
                        : 'text-slate-400 hover:text-slate-100'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>
          <button
            onClick={handleLogout}
            className="whitespace-nowrap text-sm font-medium text-slate-500 transition hover:text-red-400"
          >
            Sair
          </button>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
