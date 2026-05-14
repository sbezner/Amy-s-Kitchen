import { useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore'
import { db } from '../firebase'
import { useMealLibrary } from '../lib/db'
import { formatDateHeading, fromDateKey, isFuture, isValidDateKey } from '../lib/dates'

export function ScheduleMeal() {
  const { date } = useParams<{ date: string }>()
  const navigate = useNavigate()
  const { library, loading } = useMealLibrary()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notes, setNotes] = useState('')

  if (!date || !isValidDateKey(date)) {
    return (
      <div className="py-4">
        <div className="card text-ink-700">
          {date ? `"${date}" isn't a valid date.` : 'No date specified.'}
        </div>
      </div>
    )
  }
  const d = fromDateKey(date)

  async function pick(libraryId: string) {
    if (!date) return
    setError(null)
    setSaving(true)
    try {
      const existing = await getDocs(
        query(collection(db, 'servings'), where('servedDate', '==', date)),
      )

      if (existing.empty) {
        // Use the date as a deterministic doc id so two concurrent
        // schedules on the same day collapse to a single doc instead
        // of creating duplicates.
        await setDoc(doc(db, 'servings', date), {
          libraryId,
          servedDate: date,
          notes: notes.trim() || null,
          createdAt: serverTimestamp(),
        })
      } else {
        const existingDoc = existing.docs[0]
        const existingLibraryId = existingDoc.data().libraryId

        // If the meal is changing and ratings already exist for the
        // previous meal, those ratings belong to the previous meal.
        // Ask before clearing them — otherwise we'd silently reattach
        // old stars/comments to a different meal.
        if (existingLibraryId !== libraryId) {
          const ratingsSnap = await getDocs(
            collection(db, 'servings', existingDoc.id, 'ratings'),
          )
          if (ratingsSnap.size > 0) {
            const ok = confirm(
              `This day has ${ratingsSnap.size} rating${
                ratingsSnap.size === 1 ? '' : 's'
              } for the previous meal. Switching the meal will clear ${
                ratingsSnap.size === 1 ? 'it' : 'them'
              }. Continue?`,
            )
            if (!ok) {
              setSaving(false)
              return
            }
            await Promise.all(ratingsSnap.docs.map((r) => deleteDoc(r.ref)))
          }
        }

        await updateDoc(doc(db, 'servings', existingDoc.id), {
          libraryId,
          notes: notes.trim() || null,
        })
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
            maxLength={500}
          />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-lg">Pick from library</h3>
          <Link to="/meals/new" className="text-sm font-semibold text-terracotta-600">
            + New meal
          </Link>
        </div>

        {loading && <div className="card text-sm text-ink-500">Loading…</div>}

        {!loading && library.length === 0 && (
          <div className="card">
            <p className="text-ink-700 mb-3">No meals in the library yet.</p>
            <Link to="/meals/new" className="btn-primary w-full">
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
            {entry.photos[0] ? (
              <img
                src={entry.photos[0]}
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
