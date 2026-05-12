import { useEffect, useState } from 'react'
import { collection, doc, onSnapshot, updateDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../auth/AuthProvider'
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
    await updateDoc(doc(db, 'servings', servingId, 'ratings', r.uid), {
      hiddenByAmy: !r.hiddenByAmy,
    })
  }

  if (loading) return null

  const visible = ratings.filter((r) => isAmy || !r.hiddenByAmy)
  const avg = ratings.length
    ? ratings.reduce((acc, r) => acc + r.stars, 0) / ratings.length
    : 0

  return (
    <div className="space-y-3">
      <div className="card flex items-center justify-between">
        <div>
          <div className="text-3xl font-display font-bold">
            {ratings.length ? avg.toFixed(1) : '—'}
          </div>
          <div className="text-xs text-ink-500">
            {ratings.length} rating{ratings.length === 1 ? '' : 's'}
          </div>
        </div>
        <StarRating value={Math.round(avg)} size="md" />
      </div>

      {visible.length === 0 && (
        <div className="card text-sm text-ink-500">No ratings yet. Be the first.</div>
      )}

      {visible.map((r) => (
        <div
          key={r.uid}
          className={`card ${r.hiddenByAmy ? 'opacity-60 border border-dashed border-ink-500/30' : ''}`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-cream-200 flex items-center justify-center font-semibold text-sm text-ink-700">
                {r.raterDisplayName.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="font-semibold text-sm">{r.raterDisplayName}</div>
                <StarRating value={r.stars} size="sm" />
              </div>
            </div>
            {isAmy && (
              <button
                className="text-xs font-semibold text-ink-500 underline"
                onClick={() => toggleHidden(r)}
              >
                {r.hiddenByAmy ? 'Unhide' : 'Hide'}
              </button>
            )}
          </div>
          {r.comment && <p className="mt-2 text-ink-700 whitespace-pre-wrap text-sm">{r.comment}</p>}
          {r.hiddenByAmy && isAmy && (
            <p className="mt-2 text-xs italic text-ink-500">Hidden from everyone else.</p>
          )}
        </div>
      ))}
    </div>
  )
}
