import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../auth/AuthProvider'
import { useLibraryEntry, useServingsByMealId, useUpvotes } from '../lib/db'
import { fromDateKey, formatDateHeading, isFuture } from '../lib/dates'
import { DietaryTagChips } from '../components/DietaryTagChips'
import { Loading } from '../components/Loading'
import { PhotoGallery } from '../components/PhotoGallery'
import { RatingForm } from '../components/RatingForm'
import { RatingsList } from '../components/RatingsList'

export function MealDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { appUser } = useAuth()
  const isAmy = appUser?.role === 'amy'

  const meal = useLibraryEntry(id)
  const { servings } = useServingsByMealId(id)
  const { count: upvoteCount, upvoted } = useUpvotes(id ?? '', appUser?.uid)

  if (!id) return null
  if (meal === undefined) return <Loading />
  if (meal === null) {
    return (
      <div className="py-4">
        <div className="card">
          <p className="text-ink-700">This meal doesn't exist or has been deleted.</p>
          <Link to="/meals" className="btn-secondary mt-3 inline-block">
            ← Back to meals
          </Link>
        </div>
      </div>
    )
  }

  const isOwner = appUser?.uid === meal.createdBy
  const canDelete = isAmy || (isOwner && servings.length === 0)
  const futureServings = servings.filter((s) => isFuture(fromDateKey(s.servedDate)))
  const pastServings = servings.filter((s) => !isFuture(fromDateKey(s.servedDate)))

  async function toggleUpvote() {
    if (!appUser || !id) return
    const ref = doc(db, 'mealLibrary', id, 'upvotes', appUser.uid)
    try {
      if (upvoted) {
        await deleteDoc(ref)
      } else {
        await setDoc(ref, { createdAt: serverTimestamp() })
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not update upvote')
    }
  }

  async function handleDelete() {
    if (!id) return
    const msg =
      servings.length > 0
        ? `Delete "${meal!.name}"? This will also clear it from ${servings.length} scheduled date${servings.length === 1 ? '' : 's'}.`
        : `Delete "${meal!.name}"?`
    if (!confirm(msg)) return
    try {
      const [ratings, upvotes, refServings] = await Promise.all([
        getDocs(collection(db, 'mealLibrary', id, 'ratings')),
        getDocs(collection(db, 'mealLibrary', id, 'upvotes')),
        getDocs(query(collection(db, 'servings'), where('libraryId', '==', id))),
      ])
      const lookingForwardDocs = (
        await Promise.all(
          refServings.docs.map((s) =>
            getDocs(collection(db, 'servings', s.id, 'lookingForward')),
          ),
        )
      ).flatMap((snap) => snap.docs)

      await Promise.all([
        ...ratings.docs.map((d) => deleteDoc(d.ref)),
        ...upvotes.docs.map((d) => deleteDoc(d.ref)),
        ...lookingForwardDocs.map((d) => deleteDoc(d.ref)),
      ])
      await Promise.all(refServings.docs.map((d) => deleteDoc(d.ref)))
      await deleteDoc(doc(db, 'mealLibrary', id))
      navigate('/meals', { replace: true })
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not delete meal')
    }
  }

  return (
    <div className="py-4 space-y-4">
      <div className="flex items-center justify-between">
        <button className="btn-ghost px-2" onClick={() => navigate(-1)}>
          ← Back
        </button>
        <span aria-hidden className="w-12" />
      </div>

      <PhotoGallery photos={meal.photos} alt={meal.name} />

      <div className="card">
        <h2 className="text-2xl mb-2">{meal.name}</h2>
        {meal.dietaryTags.length > 0 && (
          <div className="mb-3">
            <DietaryTagChips tags={meal.dietaryTags} />
          </div>
        )}
        {meal.description && (
          <p className="text-ink-700 whitespace-pre-wrap">{meal.description}</p>
        )}
      </div>

      <button
        type="button"
        onClick={toggleUpvote}
        className={`w-full rounded-2xl py-3 font-semibold transition active:scale-[0.99] flex items-center justify-center gap-2 ${
          upvoted ? 'bg-terracotta-500 text-white' : 'bg-cream-100 text-ink-700 hover:bg-cream-200'
        }`}
        aria-pressed={upvoted}
      >
        <span className="text-xl">{upvoted ? '🙌' : '👍'}</span>
        <span>
          {upvoted ? 'Make this again' : 'I want this again'}
          {upvoteCount > 0 && ` · ${upvoteCount}`}
        </span>
      </button>

      <RatingForm mealId={id} />
      <RatingsList mealId={id} />

      <ServingsSection
        futureServings={futureServings}
        pastServings={pastServings}
        isAmy={isAmy}
      />

      <div className="card space-y-2">
        <Link to={`/meals/${id}/edit`} className="btn-secondary w-full">
          Edit meal
        </Link>
        <Link to="/meals/new" className="btn-ghost w-full">
          + Create another meal
        </Link>
        {canDelete && (
          <button
            className="btn-ghost w-full text-terracotta-700"
            onClick={handleDelete}
          >
            Delete meal
          </button>
        )}
      </div>
    </div>
  )
}

function ServingsSection({
  futureServings,
  pastServings,
  isAmy,
}: {
  futureServings: { id: string; servedDate: string }[]
  pastServings: { id: string; servedDate: string }[]
  isAmy: boolean
}) {
  const total = futureServings.length + pastServings.length
  if (total === 0) {
    return (
      <div className="card text-sm text-ink-500">
        Not yet on the calendar.{' '}
        {isAmy
          ? 'Tap a date on the calendar to schedule it.'
          : "Up-vote it above so we'll see it."}
      </div>
    )
  }

  return (
    <div className="card space-y-3">
      <h3 className="font-semibold">
        Served {total} time{total === 1 ? '' : 's'}
      </h3>

      {futureServings.length > 0 && (
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-ink-500 mb-1.5">
            Upcoming
          </div>
          <div className="space-y-1.5">
            {futureServings.map((s) => (
              <ServingRow key={s.id} servingId={s.id} date={s.servedDate} isAmy={isAmy} />
            ))}
          </div>
        </div>
      )}

      {pastServings.length > 0 && (
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-ink-500 mb-1.5">
            Past
          </div>
          <div className="space-y-1.5">
            {pastServings.slice(0, 12).map((s) => (
              <ServingRow key={s.id} servingId={s.id} date={s.servedDate} isAmy={isAmy} />
            ))}
            {pastServings.length > 12 && (
              <div className="text-xs text-ink-500 italic">
                + {pastServings.length - 12} earlier
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function ServingRow({
  servingId,
  date,
  isAmy,
}: {
  servingId: string
  date: string
  isAmy: boolean
}) {
  async function remove(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (!confirm(`Remove this meal from ${formatDateHeading(fromDateKey(date))}?`)) return
    try {
      await deleteDoc(doc(db, 'servings', servingId))
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not remove from this date')
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Link
        to={`/day/${date}`}
        className="flex-1 flex items-center justify-between text-sm hover:bg-cream-100/60 rounded-lg px-2 py-1.5 transition"
      >
        <span>{formatDateHeading(fromDateKey(date))}</span>
        <span className="text-ink-500">›</span>
      </Link>
      {isAmy && (
        <button
          type="button"
          onClick={remove}
          className="text-xs font-semibold text-terracotta-700 hover:bg-terracotta-500/10 rounded-lg px-2 py-1.5 transition shrink-0"
          aria-label={`Remove from ${date}`}
        >
          Remove
        </button>
      )}
    </div>
  )
}
