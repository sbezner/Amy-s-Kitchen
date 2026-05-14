import { Link, useNavigate, useParams } from 'react-router-dom'
import { deleteDoc, doc } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../auth/AuthProvider'
import { useLibraryEntry, useServingByDate } from '../lib/db'
import { fromDateKey, formatDateHeading, isFuture, isValidDateKey } from '../lib/dates'
import { DietaryTagChips } from '../components/DietaryTagChips'
import { Loading } from '../components/Loading'
import { LookingForwardButton } from '../components/LookingForwardButton'

export function DayDetail() {
  const { date } = useParams<{ date: string }>()
  const navigate = useNavigate()
  const { appUser } = useAuth()
  const isAmy = appUser?.role === 'amy'

  const serving = useServingByDate(date)
  const entry = useLibraryEntry(serving?.libraryId)

  if (!date || !isValidDateKey(date)) {
    return (
      <div className="py-4">
        <div className="card text-ink-700">
          {date ? `"${date}" isn't a valid date.` : 'Pick a date from the calendar.'}
        </div>
      </div>
    )
  }

  const d = fromDateKey(date)
  const future = isFuture(d)

  if (serving === undefined) return <Loading />

  async function handleRemove() {
    if (!serving) return
    if (!confirm('Remove this meal from this date?')) return
    try {
      await deleteDoc(doc(db, 'servings', serving.id))
      navigate('/', { replace: true })
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not remove meal')
    }
  }

  return (
    <div className="py-4 space-y-4">
      <div className="flex items-center justify-between">
        <button className="btn-ghost px-2" onClick={() => navigate(-1)}>
          ← Back
        </button>
        <div className="text-sm text-ink-500">{future ? 'Planned' : 'Served'}</div>
      </div>

      <h2 className="text-2xl">{formatDateHeading(d)}</h2>

      {serving === null && (
        <div className="card">
          <p className="text-ink-700 mb-3">No meal scheduled for this day.</p>
          <Link to={`/schedule/${date}`} className="btn-primary w-full">
            Schedule a meal
          </Link>
        </div>
      )}

      {serving && (
        <>
          {entry?.photos[0] && (
            <img
              src={entry.photos[0]}
              alt=""
              className="w-full aspect-[4/3] object-cover rounded-3xl shadow-soft"
            />
          )}

          <div className="card">
            <h3 className="text-2xl mb-2">{entry?.name ?? 'Meal'}</h3>
            {entry && entry.dietaryTags.length > 0 && (
              <div className="mb-3">
                <DietaryTagChips tags={entry.dietaryTags} />
              </div>
            )}
            {serving.notes && (
              <p className="text-sm text-ink-500 italic">{serving.notes}</p>
            )}
            {entry && (
              <Link
                to={`/meals/${entry.id}`}
                className="btn-primary w-full mt-4 inline-block text-center"
              >
                View meal · rate it →
              </Link>
            )}
          </div>

          {future && <LookingForwardButton servingId={serving.id} />}

          <div className="card space-y-2">
            <Link to={`/schedule/${date}`} className="btn-secondary w-full">
              Change which meal
            </Link>
            {isAmy && (
              <button className="btn-ghost w-full text-terracotta-700" onClick={handleRemove}>
                Remove from this date
              </button>
            )}
          </div>
        </>
      )}
    </div>
  )
}
