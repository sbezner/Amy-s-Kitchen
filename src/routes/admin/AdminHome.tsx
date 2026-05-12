import { Link } from 'react-router-dom'

const TILES = [
  { to: '/admin/meals', title: 'Meal library', body: 'Add, edit, or remove meals you cook.' },
  { to: '/admin/employees', title: 'Employees', body: 'Approve sign-ups and manage the roster.' },
  { to: '/admin/requests', title: 'Requests', body: 'See what Energized Engines is asking for.' },
  { to: '/admin/reports', title: 'Reports', body: 'Most and least liked meals at a glance.' },
]

export function AdminHome() {
  return (
    <div className="py-4 space-y-3">
      <h2 className="text-2xl">Admin</h2>
      {TILES.map((t) => (
        <Link key={t.to} to={t.to} className="card flex items-center justify-between hover:bg-cream-100/60 transition">
          <div>
            <div className="font-semibold text-lg">{t.title}</div>
            <div className="text-sm text-ink-500">{t.body}</div>
          </div>
          <span aria-hidden className="text-2xl text-ink-500">›</span>
        </Link>
      ))}
    </div>
  )
}
