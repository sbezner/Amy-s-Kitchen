import { useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import {
  addDoc,
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore'
import { db } from '../../firebase'
import { useMealLibrary } from '../../lib/db'
import { formatDateHeading, fromDateKey, isFuture } from '../../lib/dates'

export function ScheduleMeal() {
  const { date } = useParams<{ date: string }>()
  const navigate = useNavigate()
  const { library, loading } = useMealLibrary()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notes, setNotes] = useState('')

  if (!date) return null
  const d = fromDateKey(date)

  async function pick(libraryId: string) {
    setError(null)
    setSaving(true)
    try {
      // Replace any existing serving on this date so we maintain "one per day".
      const existing = await getDocs(
        query(collection(db, 'servings'), where('servedDate', '==', date)),
      )
      if (existing.empty) {
        await addDoc(collection(db, 'servings'), {
          libraryId,
          servedDate: date,
          notes: notes.trim() || null,
          createdAt: serverTimestamp(),
        })
      } else {
        const existingDoc = existing.docs[0]
        await updateDoc(doc(db, 'servings', existingDoc.id), {
          libraryId,
          notes: notes.trim() || null,
        })
        // If we changed which library entry is on this date, delete any leftover
        // ratings tied to the OLD serving doc — but we're updating in place, so
        // ratings persist. (Phase 3 stores ratings per serving id.)
      }
      navigate(`/day/${date}`, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="py-4 space-y-4">
      <button className="btn-ghost px-2" onClick={() => navigate(-1)}>
        ← Back
      </button>
      <div>
        <h2 className="text-2xl">Schedule a meal</h2>
        <p className="text-ink-500 text-sm">
          {formatDateHeading(d)} · {isFuture(d) ? 'planned' : 'past date'}
        </p>
      </div>

      <div className="card space-y-3">
        <div>
          <label className="label" htmlFor="notes">
            Notes for this serving (optional)
          </label>
          <input
            id="notes"
            className="input"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. extra spicy this time, side salad included"
          />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-lg">Pick from library</h3>
          <Link to="/admin/meals/new" className="text-sm font-semibold text-terracotta-600">
            + New meal
          </Link>
        </div>

        {loading && <div className="card text-sm text-ink-500">Loading…</div>}

        {!loading && library.length === 0 && (
          <div className="card">
            <p className="text-ink-700 mb-3">No meals in the library yet.</p>
            <Link to="/admin/meals/new" className="btn-primary w-full">
              Add your first meal
            </Link>
          </div>
        )}

        {library.map((entry) => (
          <button
            key={entry.id}
            type="button"
            className="card w-full text-left flex gap-3 hover:bg-cream-100/60 transition"
            disabled={saving}
            onClick={() => pick(entry.id)}
          >
            {entry.photoUrl ? (
              <img
                src={entry.photoUrl}
                alt=""
                className="w-16 h-16 object-cover rounded-2xl shrink-0"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-cream-100 shrink-0 flex items-center justify-center text-2xl">
                🍽️
              </div>
            )}
            <div className="flex-1">
              <div className="font-semibold">{entry.name}</div>
              {entry.description && (
                <div className="text-sm text-ink-500 line-clamp-2">{entry.description}</div>
              )}
            </div>
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-2xl bg-terracotta-500/10 text-terracotta-700 px-4 py-3 text-sm">
          {error}
        </div>
      )}
    </div>
  )
}
