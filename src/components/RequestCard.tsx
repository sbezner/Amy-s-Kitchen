import { useState } from 'react'
import { deleteDoc, doc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../auth/AuthProvider'
import { useDisplayName } from '../lib/users'
import { useUpvotes } from '../lib/requests'
import type { Request } from '../types'

const STATUS_LABEL: Record<Request['status'], string> = {
  open: 'Open',
  scheduled: 'Scheduled',
  made: 'Made',
  declined: 'Declined',
}

const STATUS_STYLE: Record<Request['status'], string> = {
  open: 'bg-cream-200 text-ink-700',
  scheduled: 'bg-terracotta-500/15 text-terracotta-700',
  made: 'bg-sage-500/15 text-sage-600',
  declined: 'bg-ink-500/15 text-ink-500',
}

interface Props {
  request: Request
  adminMode?: boolean
}

export function RequestCard({ request, adminMode = false }: Props) {
  const { appUser } = useAuth()
  const isMine = appUser?.uid === request.requestedBy
  const isAmy = appUser?.role === 'amy'
  const showActions = isMine || isAmy
  const { count, upvoted } = useUpvotes(request.id, appUser?.uid)
  const requesterName = useDisplayName(request.requestedBy, request.requestedByName)

  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState(request.mealName)
  const [editNotes, setEditNotes] = useState(request.notes ?? '')

  async function toggleUpvote() {
    if (!appUser) return
    const ref = doc(db, 'requests', request.id, 'upvotes', appUser.uid)
    try {
      if (upvoted) {
        await deleteDoc(ref)
      } else {
        await setDoc(ref, { createdAt: serverTimestamp() })
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not update your upvote')
    }
  }

  async function setStatus(status: Request['status']) {
    try {
      await updateDoc(doc(db, 'requests', request.id), { status })
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not update status')
    }
  }

  async function saveEdit() {
    try {
      await updateDoc(doc(db, 'requests', request.id), {
        mealName: editName.trim(),
        notes: editNotes.trim() || null,
      })
      setEditing(false)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not save changes')
    }
  }

  async function remove() {
    if (!confirm('Delete this request?')) return
    try {
      await deleteDoc(doc(db, 'requests', request.id))
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not delete request')
    }
  }

  if (editing) {
    return (
      <div className="card space-y-3">
        <div>
          <label className="label" htmlFor={`name-${request.id}`}>
            Meal
          </label>
          <input
            id={`name-${request.id}`}
            className="input"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            maxLength={120}
            autoFocus
          />
        </div>
        <div>
          <label className="label" htmlFor={`notes-${request.id}`}>
            Notes
          </label>
          <textarea
            id={`notes-${request.id}`}
            className="input min-h-[60px]"
            value={editNotes}
            onChange={(e) => setEditNotes(e.target.value)}
            maxLength={1000}
          />
        </div>
        <div className="flex gap-2">
          <button className="btn-primary flex-1" onClick={saveEdit} disabled={!editName.trim()}>
            Save
          </button>
          <button className="btn-ghost" onClick={() => setEditing(false)}>
            Cancel
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-lg truncate">{request.mealName}</h3>
            <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${STATUS_STYLE[request.status]}`}>
              {STATUS_LABEL[request.status]}
            </span>
          </div>
          <div className="text-xs text-ink-500 mt-0.5">Suggested by {requesterName}</div>
          {request.notes && (
            <p className="text-sm text-ink-700 mt-2 whitespace-pre-wrap">{request.notes}</p>
          )}
        </div>

        <button
          type="button"
          onClick={toggleUpvote}
          className={`shrink-0 flex flex-col items-center justify-center w-14 rounded-2xl py-2 transition active:scale-95 ${
            upvoted ? 'bg-terracotta-500 text-white' : 'bg-cream-100 text-ink-700 hover:bg-cream-200'
          }`}
          aria-label={upvoted ? 'Remove upvote' : 'Upvote'}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5l-7 8h4v6h6v-6h4z" />
          </svg>
          <span className="text-sm font-bold">{count}</span>
        </button>
      </div>

      {showActions && (
        <div className="mt-3 pt-3 border-t border-cream-200 flex flex-wrap items-center gap-2">
          {isMine && request.status === 'open' && (
            <>
              <button className="text-sm font-semibold text-ink-700 underline" onClick={() => setEditing(true)}>
                Edit
              </button>
              <button className="text-sm font-semibold text-terracotta-700 underline" onClick={remove}>
                Delete
              </button>
            </>
          )}

          {isAmy && adminMode && (
            <>
              <div className="text-xs text-ink-500 mr-1">Set status:</div>
              {(['open', 'scheduled', 'made', 'declined'] as const).map((s) => (
                <button
                  key={s}
                  className={`text-xs font-semibold px-2.5 py-1 rounded-full transition ${
                    request.status === s ? STATUS_STYLE[s] : 'text-ink-500 hover:bg-cream-100'
                  }`}
                  onClick={() => setStatus(s)}
                >
                  {STATUS_LABEL[s]}
                </button>
              ))}
              <button className="text-xs font-semibold text-ink-500 underline ml-auto" onClick={() => setEditing(true)}>
                Edit
              </button>
              <button className="text-xs font-semibold text-terracotta-700 underline" onClick={remove}>
                Delete
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
