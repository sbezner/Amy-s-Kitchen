import { useMemo, useState, type FormEvent } from 'react'
import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../auth/AuthProvider'
import { useRequests } from '../lib/requests'
import { RequestCard } from '../components/RequestCard'
import type { Request } from '../types'

export function Requests() {
  const { appUser } = useAuth()
  const { requests, loading } = useRequests()

  const [mealName, setMealName] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!appUser || !mealName.trim()) return
    setSubmitting(true)
    setError(null)
    try {
      await addDoc(collection(db, 'requests'), {
        requestedBy: appUser.uid,
        requestedByName: appUser.displayName,
        mealName: mealName.trim(),
        notes: notes.trim() || null,
        status: 'open',
        createdAt: serverTimestamp(),
      })
      setMealName('')
      setNotes('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="py-4 space-y-4">
      <form className="card space-y-3" onSubmit={submit}>
        <h2 className="text-xl">Suggest a meal</h2>
        <div>
          <label className="label" htmlFor="meal-name">
            Meal
          </label>
          <input
            id="meal-name"
            className="input"
            value={mealName}
            onChange={(e) => setMealName(e.target.value)}
            placeholder="Lasagna, butter chicken, sushi…"
            required
          />
        </div>
        <div>
          <label className="label" htmlFor="meal-notes">
            Notes (optional)
          </label>
          <textarea
            id="meal-notes"
            className="input min-h-[60px]"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Anything Amy should know?"
          />
        </div>
        {error && (
          <div className="rounded-2xl bg-terracotta-500/10 text-terracotta-700 px-4 py-3 text-sm">
            {error}
          </div>
        )}
        <button className="btn-primary w-full" disabled={submitting || !mealName.trim()}>
          {submitting ? 'Submitting…' : 'Add to the list'}
        </button>
      </form>

      <RequestList requests={requests} loading={loading} />
    </div>
  )
}

interface RequestListProps {
  requests: Request[]
  loading: boolean
  adminMode?: boolean
  statusFilter?: Request['status'] | 'all'
}

export function RequestList({ requests, loading, adminMode = false, statusFilter = 'all' }: RequestListProps) {
  const filtered = useMemo(() => {
    return statusFilter === 'all' ? requests : requests.filter((r) => r.status === statusFilter)
  }, [requests, statusFilter])

  if (loading) return <div className="card text-sm text-ink-500">Loading requests…</div>

  if (filtered.length === 0) {
    return (
      <div className="card text-sm text-ink-700">
        {statusFilter === 'all' ? 'No requests yet. Be the first.' : 'Nothing in this state.'}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {filtered.map((r) => (
        <RequestCard key={r.id} request={r} adminMode={adminMode} />
      ))}
    </div>
  )
}
