import { useEffect, useState } from 'react'
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore'
import { db } from '../firebase'
import type { Request } from '../types'

export function useRequests(): { requests: Request[]; loading: boolean } {
  const [requests, setRequests] = useState<Request[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const q = query(collection(db, 'requests'), orderBy('createdAt', 'desc'))
    return onSnapshot(q, (snap) => {
      setRequests(
        snap.docs.map((d) => {
          const data = d.data()
          return {
            id: d.id,
            requestedBy: data.requestedBy,
            requestedByName: data.requestedByName,
            mealName: data.mealName,
            notes: data.notes,
            status: data.status,
            scheduledServingId: data.scheduledServingId,
            createdAt: data.createdAt?.toMillis?.() ?? 0,
          }
        }),
      )
      setLoading(false)
    })
  }, [])

  return { requests, loading }
}

export function useUpvotes(requestId: string, currentUid?: string) {
  const [uids, setUids] = useState<string[]>([])

  useEffect(() => {
    return onSnapshot(collection(db, 'requests', requestId, 'upvotes'), (snap) => {
      setUids(snap.docs.map((d) => d.id))
    })
  }, [requestId])

  return {
    count: uids.length,
    upvoted: currentUid ? uids.includes(currentUid) : false,
  }
}
