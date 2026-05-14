import { NavLink, Outlet } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { auth } from '../firebase'
import { useAuth } from '../auth/AuthProvider'
import { InstallBanner } from './InstallBanner'

export function Layout() {
  const { appUser } = useAuth()
  const isAmy = appUser?.role === 'amy'

  return (
    <div className="min-h-screen flex flex-col bg-cream-50">
      <header className="px-5 pt-5 pb-4 border-b border-cream-200 bg-white/80 backdrop-blur print:hidden">
        <div className="flex items-center gap-8">
          <div className="flex-shrink-0">
            <h1 className="text-2xl leading-tight">Amy's Kitchen</h1>
            <p className="text-xs text-ink-500">
              Hi {appUser?.displayName}
              {isAmy ? ' · admin' : ''}
            </p>
          </div>

          <nav className="flex items-center gap-1 sm:gap-2">
            <TabLink to="/" label="Calendar" end />
            <TabLink to="/requests" label="Requests" />
            {isAmy && <TabLink to="/admin" label="Admin" />}
            <TabLink to="/about" label="About" />
          </nav>

          <button className="btn-ghost text-sm px-3 py-2 flex-shrink-0 ml-auto" onClick={() => signOut(auth)}>
            Sign out
          </button>
        </div>
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
