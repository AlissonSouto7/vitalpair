import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export function Layout() {
  const { logout } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  return (
    <div className="min-h-full">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-6">
            <span className="text-lg font-bold text-blue-700">VitaPair</span>
            <nav className="flex gap-4 text-sm">
              <NavItem to="/dashboard" label="Dashboard" />
              <NavItem to="/nutrition" label="Refeições" />
              <NavItem to="/activity" label="Atividade" />
              <NavItem to="/profile" label="Perfil" />
            </nav>
          </div>
          <button
            onClick={handleLogout}
            className="text-sm font-medium text-slate-500 transition hover:text-red-600"
          >
            Sair
          </button>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}

function NavItem({ to, label }: { to: string; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        isActive ? 'font-semibold text-blue-700' : 'text-slate-500 hover:text-slate-800'
      }
    >
      {label}
    </NavLink>
  )
}
