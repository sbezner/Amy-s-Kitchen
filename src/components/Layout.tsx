import { Link, NavLink, Outlet } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { auth } from '../firebase'
import { useAuth } from '../auth/AuthProvider'
import { InstallBanner } from './InstallBanner'

export function Layout() {
  const { appUser } = useAuth()
  const isAmy = appUser?.role === 'amy'

  return (
    <div className="min-h-screen flex flex-col bg-cream-50">
      <header className="px-4 sm:px-5 pt-4 sm:pt-5 pb-3 border-b border-cream-200 bg-white/80 backdrop-blur print:hidden">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl leading-tight">Amy's Kitchen</h1>
            <Link to="/profile" className="text-xs text-ink-500 truncate hover:text-ink-700 transition block">
              Hi {appUser?.displayName}
              {isAmy ? ' · admin' : ''}
            </Link>
          </div>

          <button
            className="btn-ghost text-sm px-3 py-2 flex-shrink-0"
            onClick={() => signOut(auth)}
          >
            Sign out
          </button>
        </div>

        <nav className="flex items-center gap-1 mt-3 -mx-1 overflow-x-auto sm:overflow-visible">
          <TabLink to="/" label="Calendar" end />
          <TabLink to="/meals" label="Meals" />
          <TabLink to="/reports" label="Reports" />
          {isAmy && <TabLink to="/admin" label="Admin" />}
          <TabLink to="/about" label="About" />
        </nav>
      </header>

      <InstallBanner />

      <main className="flex-1 px-5 pb-8">
        <Outlet />
      </main>
    </div>
  )
}

function TabLink({
  to,
  label,
  end,
}: {
  to: string
  label: string
  end?: boolean
}) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `px-3 sm:px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
          isActive
            ? 'bg-terracotta-500/10 text-terracotta-700'
            : 'text-ink-500 hover:text-ink-700 hover:bg-cream-100'
        }`
      }
    >
      {label}
    </NavLink>
  )
}
