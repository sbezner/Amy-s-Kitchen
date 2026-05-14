import { useEffect, useState } from 'react'
import { collection, doc, onSnapshot, updateDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../auth/AuthProvider'
import { useDisplayName } from '../lib/users'
import { StarRating } from './StarRating'

interface RatingDoc {
  uid: string
  stars: number
  comment?: string
  hiddenByAmy?: boolean
  raterDisplayName: string
  updatedAt: number
}

interface Props {
  servingId: string
}

export function RatingsList({ servingId }: Props) {
  const { appUser } = useAuth()
  const isAmy = appUser?.role === 'amy'
  const [ratings, setRatings] = useState<RatingDoc[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const col = collection(db, 'servings', servingId, 'ratings')
    return onSnapshot(col, (snap) => {
      const list: RatingDoc[] = snap.docs.map((d) => {
        const data = d.data()
        return {
          uid: d.id,
          stars: data.stars,
          comment: data.comment,
          hiddenByAmy: data.hiddenByAmy ?? false,
          raterDisplayName: data.raterDisplayName ?? 'Member',
          updatedAt: data.updatedAt?.toMillis?.() ?? 0,
        }
      })
      list.sort((a, b) => b.updatedAt - a.updatedAt)
      setRatings(list)
      setLoading(false)
    })
  }, [servingId])

  async function toggleHidden(r: RatingDoc) {
    try {
      await updateDoc(doc(db, 'servings', servingId, 'ratings', r.uid), {
        hiddenByAmy: !r.hiddenByAmy,
      })
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not update rating')
    }
  }

  if (loading) return null

  const visible = ratings.filter((r) => isAmy || !r.hiddenByAmy)
  // Average and count exclude hidden ratings so a hidden rating
  // doesn't silently skew the displayed score.
  const countable = ratings.filter((r) => !r.hiddenByAmy)
  const avg = countable.length
    ? countable.reduce((acc, r) => acc + r.stars, 0) / countable.length
    : 0

  return (
    <div className="space-y-3">
      <div className="card flex items-center justify-between">
        <div>
          <div className="text-3xl font-display font-bold">
            {countable.length ? avg.toFixed(1) : '—'}
          </div>
          <div className="text-xs text-ink-500">
            {countable.length} rating{countable.length === 1 ? '' : 's'}
          </div>
        </div>
        <StarRating value={Math.round(avg)} size="md" />
      </div>

      {visible.length === 0 && (
        <div className="card text-sm text-ink-500">No ratings yet. Be the first.</div>
      )}

      {visible.map((r) => (
        <RatingRow
          key={r.uid}
          rating={r}
          isAmy={isAmy}
          onToggleHidden={() => toggleHidden(r)}
        />
      ))}
    </div>
  )
}

function RatingRow({
  rating,
  isAmy,
  onToggleHidden,
}: {
  rating: RatingDoc
  isAmy: boolean
  onToggleHidden: () => void
}) {
  const displayName = useDisplayName(rating.uid, rating.raterDisplayName)
  return (
    <div
      className={`card ${rating.hiddenByAmy ? 'opacity-60 border border-dashed border-ink-500/30' : ''}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-cream-200 flex items-center justify-center font-semibold text-sm text-ink-700">
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="font-semibold text-sm">{displayName}</div>
            <StarRating value={rating.stars} size="sm" />
          </div>
        </div>
        {isAmy && (
          <button
            className="text-xs font-semibold text-ink-500 underline"
            onClick={onToggleHidden}
          >
            {rating.hiddenByAmy ? 'Unhide' : 'Hide'}
          </button>
        )}
      </div>
      {rating.comment && (
        <p className="mt-2 text-ink-700 whitespace-pre-wrap text-sm">{rating.comment}</p>
      )}
      {rating.hiddenByAmy && isAmy && (
        <p className="mt-2 text-xs italic text-ink-500">Hidden from everyone else.</p>
      )}
    </div>
  )
}
