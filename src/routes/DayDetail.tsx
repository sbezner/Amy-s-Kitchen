import { Link, useNavigate, useParams } from 'react-router-dom'
import { deleteDoc, doc } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../auth/AuthProvider'
import { useLibraryEntry, useServingByDate } from '../lib/db'
import { fromDateKey, formatDateHeading, isFuture } from '../lib/dates'
import { DietaryTagChips } from '../components/DietaryTagChips'
import { Loading } from '../components/Loading'
import { RatingForm } from '../components/RatingForm'
import { RatingsList } from '../components/RatingsList'
import { LookingForwardButton } from '../components/LookingForwardButton'

export function DayDetail() {
  const { date } = useParams<{ date: string }>()
  const navigate = useNavigate()
  const { appUser } = useAuth()
  const isAmy = appUser?.role === 'amy'

  const serving = useServingByDate(date)
  const entry = useLibraryEntry(serving?.libraryId)

  if (!date) {
    return <Navigation message="Pick a date from the calendar." />
  }

  const d = fromDateKey(date)
  const future = isFuture(d)

  if (serving === undefined) {
    return <Loading />
  }

  async function handleDelete() {
    if (!serving) return
    if (!confirm('Remove this meal from this date? Ratings will be deleted too.')) return
    await deleteDoc(doc(db, 'servings', serving.id))
    navigate('/', { replace: true })
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
          <p className="text-ink-700">No meal scheduled for this day.</p>
          {isAmy && (
            <Link to={`/admin/schedule/${date}`} className="btn-primary mt-4 w-full">
              Schedule a meal
            </Link>
          )}
        </div>
      )}

      {serving && (
        <>
          {entry?.photoUrl && (
            <img
              src={entry.photoUrl}
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
            {entry?.description && (
              <p className="text-ink-700 whitespace-pre-wrap">{entry.description}</p>
            )}
            {serving.notes && (
              <p className="mt-3 text-sm text-ink-500 italic">{serving.notes}</p>
            )}
          </div>

          {isAmy && (
            <div className="card space-y-2">
              <p className="text-sm font-semibold text-ink-700">Amy</p>
              <Link
                to={`/admin/schedule/${date}`}
                className="btn-secondary w-full"
              >
                Change which meal
              </Link>
              <button className="btn-ghost w-full text-terracotta-700" onClick={handleDelete}>
                Remove from this date
              </button>
            </div>
          )}

          {future ? (
            <LookingForwardButton servingId={serving.id} />
          ) : (
            <>
              <RatingForm servingId={serving.id} />
              <RatingsList servingId={serving.id} />
            </>
          )}
        </>
      )}
    </div>
  )
}

function Navigation({ message }: { message: string }) {
  return (
    <div className="py-4">
      <div className="card">
        <p className="text-ink-700">{message}</p>
      </div>
    </div>
  )
}
