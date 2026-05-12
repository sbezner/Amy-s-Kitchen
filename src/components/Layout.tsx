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
      <header className="px-5 pt-5 pb-3 flex items-center justify-between print:hidden">
        <div>
          <h1 className="text-2xl leading-tight">Amy's Kitchen</h1>
          <p className="text-xs text-ink-500">
            Hi {appUser?.displayName}
            {isAmy ? ' · admin' : ''}
          </p>
        </div>
        <button className="btn-ghost text-sm px-3 py-2" onClick={() => signOut(auth)}>
          Sign out
        </button>
      </header>

      <InstallBanner />

      <main className="flex-1 px-5 pb-28">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur border-t border-cream-200 pb-[env(safe-area-inset-bottom)] print:hidden">
        <div className="max-w-md mx-auto grid grid-cols-3">
          <TabLink to="/" label="Calendar" icon={CalendarIcon} end />
          <TabLink to="/requests" label="Requests" icon={RequestsIcon} />
          {isAmy ? (
            <TabLink to="/admin" label="Admin" icon={AdminIcon} />
          ) : (
            <span aria-hidden className="opacity-0" />
          )}
        </div>
      </nav>
    </div>
  )
}

function TabLink({
  to,
  label,
  icon: Icon,
  end,
}: {
  to: string
  label: string
  icon: (props: { active: boolean }) => JSX.Element
  end?: boolean
}) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `flex flex-col items-center gap-1 py-3 text-xs font-semibold ${
          isActive ? 'text-terracotta-600' : 'text-ink-500'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <Icon active={isActive} />
          <span>{label}</span>
        </>
      )}
    </NavLink>
  )
}

function CalendarIcon({ active }: { active: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.4 : 2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </svg>
  )
}

function RequestsIcon({ active }: { active: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.4 : 2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 21s-7-4.5-7-10a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 5.5-7 10-7 10z" />
    </svg>
  )
}

function AdminIcon({ active }: { active: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.4 : 2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l8 4v5c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7l8-4z" />
    </svg>
  )
}
