import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useRequests } from '../../lib/requests'
import { RequestList } from '../Requests'
import type { Request } from '../../types'

const FILTERS: Array<{ value: Request['status'] | 'all'; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'open', label: 'Open' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'made', label: 'Made' },
  { value: 'declined', label: 'Declined' },
]

export function RequestsAdmin() {
  const navigate = useNavigate()
  const { requests, loading } = useRequests()
  const [filter, setFilter] = useState<Request['status'] | 'all'>('open')

  return (
    <div className="py-4 space-y-4">
      <div className="flex items-center justify-between">
        <button className="btn-ghost px-2" onClick={() => navigate(-1)}>
          ← Back
        </button>
        <h2 className="text-2xl">Requests</h2>
        <span aria-hidden className="w-12" />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {FILTERS.map((f) => {
          const active = filter === f.value
          const count = f.value === 'all' ? requests.length : requests.filter((r) => r.status === f.value).length
          return (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-semibold transition ${
                active ? 'bg-terracotta-500 text-white' : 'bg-cream-100 text-ink-700 hover:bg-cream-200'
              }`}
            >
              {f.label} <span className={active ? 'opacity-80' : 'opacity-60'}>· {count}</span>
            </button>
          )
        })}
      </div>

      <RequestList requests={requests} loading={loading} adminMode statusFilter={filter} />
    </div>
  )
}
