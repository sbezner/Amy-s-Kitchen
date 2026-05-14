import { useEffect, useState } from 'react'
import { deleteDoc, doc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../auth/AuthProvider'
import { StarRating } from './StarRating'

interface Props {
  servingId: string
}

export function RatingForm({ servingId }: Props) {
  const { appUser } = useAuth()
  const [stars, setStars] = useState(0)
  const [comment, setComment] = useState('')
  const [savedStars, setSavedStars] = useState(0)
  const [savedComment, setSavedComment] = useState('')
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState<number | null>(null)

  useEffect(() => {
    if (!appUser) return
    const ref = doc(db, 'servings', servingId, 'ratings', appUser.uid)
    return onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        const data = snap.data()
        setSavedStars(data.stars ?? 0)
        setSavedComment(data.comment ?? '')
        setStars(data.stars ?? 0)
        setComment(data.comment ?? '')
      } else {
        setSavedStars(0)
        setSavedComment('')
      }
    })
  }, [appUser, servingId])

  const dirty = stars !== savedStars || comment !== savedComment
  const lowRating = stars > 0 && stars <= 2

  async function save() {
    if (!appUser || stars === 0) return
    setSaving(true)
    try {
      const ref = doc(db, 'servings', servingId, 'ratings', appUser.uid)
      // We don't store the display name here on purpose — it's
      // looked up live from the user doc so renames propagate.
      await setDoc(
        ref,
        {
          stars,
          comment: comment.trim(),
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      )
      setSavedAt(Date.now())
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not save your rating')
    } finally {
      setSaving(false)
    }
  }

  async function clear() {
    if (!appUser) return
    if (!confirm('Remove your rating for this meal?')) return
    try {
      await deleteDoc(doc(db, 'servings', servingId, 'ratings', appUser.uid))
      setStars(0)
      setComment('')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not remove your rating')
    }
  }

  return (
    <div className="card space-y-3">
      <div>
        <div className="label">Your rating</div>
        <div className="flex items-center gap-3">
          <StarRating value={stars} onChange={setStars} size="lg" />
          {stars > 0 && (
            <button type="button" className="text-sm text-ink-500 underline" onClick={clear}>
              clear
            </button>
          )}
        </div>
      </div>

      {stars > 0 && (
        <div>
          <label className="label" htmlFor="comment">
            {lowRating ? "Tell us what didn't work" : 'Comment (optional)'}
          </label>
          <textarea
            id="comment"
            className="input min-h-[80px]"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={1000}
            placeholder={lowRating ? 'Helps us understand the rating.' : 'Anything you want to share.'}
          />
        </div>
      )}

      {dirty && (
        <button className="btn-primary w-full" onClick={save} disabled={saving || stars === 0}>
          {saving ? 'Saving…' : savedStars > 0 ? 'Update' : 'Save rating'}
        </button>
      )}

      {!dirty && savedAt && (
        <p className="text-sm text-sage-600 font-semibold">Saved · you can change this any time.</p>
      )}
    </div>
  )
}
