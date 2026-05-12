import { useEffect, useState } from 'react'
import { collection, deleteDoc, doc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../auth/AuthProvider'

interface Props {
  servingId: string
}

interface Reaction {
  uid: string
  raterDisplayName: string
}

export function LookingForwardButton({ servingId }: Props) {
  const { appUser } = useAuth()
  const [reactions, setReactions] = useState<Reaction[]>([])
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const col = collection(db, 'servings', servingId, 'lookingForward')
    return onSnapshot(col, (snap) => {
      setReactions(
        snap.docs.map((d) => ({
          uid: d.id,
          raterDisplayName: d.data().raterDisplayName ?? 'Member',
        })),
      )
    })
  }, [servingId])

  const mine = reactions.find((r) => r.uid === appUser?.uid)

  async function toggle() {
    if (!appUser || busy) return
    setBusy(true)
    try {
      const ref = doc(db, 'servings', servingId, 'lookingForward', appUser.uid)
      if (mine) {
        await deleteDoc(ref)
      } else {
        await setDoc(ref, {
          raterDisplayName: appUser.displayName,
          createdAt: serverTimestamp(),
        })
      }
    } finally {
      setBusy(false)
    }
  }

  const others = reactions
    .filter((r) => r.uid !== appUser?.uid)
    .slice(0, 3)
    .map((r) => r.raterDisplayName)
  const moreCount = Math.max(0, reactions.length - (mine ? 1 : 0) - others.length)

  return (
    <div className="card">
      <button
        type="button"
        onClick={toggle}
        disabled={busy}
        className={`w-full flex items-center justify-center gap-2 rounded-2xl py-3 font-semibold transition active:scale-[0.98] ${
          mine ? 'bg-sage-500 text-white' : 'bg-cream-100 text-ink-900 hover:bg-cream-200'
        }`}
      >
        <span className="text-xl">{mine ? '💚' : '👋'}</span>
        <span>{mine ? "You're looking forward to this" : 'Looking forward'}</span>
      </button>
      {(mine || reactions.length > 0) && (
        <p className="mt-2 text-xs text-ink-500 text-center">
          {reactions.length} {reactions.length === 1 ? 'person is' : 'people are'} excited
          {others.length > 0 && (
            <>
              {' '}— {others.join(', ')}
              {moreCount > 0 ? ` +${moreCount} more` : ''}
            </>
          )}
        </p>
      )}
    </div>
  )
}
