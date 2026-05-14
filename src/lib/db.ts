import { useEffect, useState } from 'react'
import {
  collection,
  doc,
  onSnapshot,
  query,
  where,
  orderBy,
} from 'firebase/firestore'
import { db } from '../firebase'
import type { MealLibraryEntry, Serving, DietaryTag } from '../types'

function toEntry(id: string, data: Record<string, unknown>): MealLibraryEntry {
  // Legacy compat: old docs had `photoUrl` (single). Promote to photos[].
  let photos: string[] = []
  if (Array.isArray(data.photos)) {
    photos = data.photos.filter((p): p is string => typeof p === 'string')
  } else if (typeof data.photoUrl === 'string' && data.photoUrl) {
    photos = [data.photoUrl]
  }
  const createdAtField = data.createdAt as { toMillis?: () => number } | undefined
  const declinedAtField = data.declinedAt as { toMillis?: () => number } | undefined
  return {
    id,
    name: (data.name as string) ?? '',
    description: (data.description as string) ?? '',
    photos,
    dietaryTags: ((data.dietaryTags as DietaryTag[]) ?? []),
    createdAt: createdAtField?.toMillis?.() ?? 0,
    createdBy: data.createdBy as string | undefined,
    declinedReason: (data.declinedReason as string) || undefined,
    declinedAt: declinedAtField?.toMillis?.(),
    declinedBy: data.declinedBy as string | undefined,
  }
}

export function useMealLibrary(): { library: MealLibraryEntry[]; loading: boolean } {
  const [library, setLibrary] = useState<MealLibraryEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const q = query(collection(db, 'mealLibrary'), orderBy('name'))
    return onSnapshot(q, (snap) => {
      setLibrary(snap.docs.map((d) => toEntry(d.id, d.data())))
      setLoading(false)
    })
  }, [])

  return { library, loading }
}

export function useLibraryEntry(id: string | undefined): MealLibraryEntry | null | undefined {
  // undefined = still loading, null = not found
  const [entry, setEntry] = useState<MealLibraryEntry | null | undefined>(undefined)
  useEffect(() => {
    if (!id) {
      setEntry(null)
      return
    }
    return onSnapshot(doc(db, 'mealLibrary', id), (snap) => {
      if (!snap.exists()) {
        setEntry(null)
        return
      }
      setEntry(toEntry(snap.id, snap.data()))
    })
  }, [id])
  return entry
}

function toServing(id: string, data: Record<string, unknown>): Serving {
  const createdAtField = data.createdAt as { toMillis?: () => number } | undefined
  return {
    id,
    libraryId: (data.libraryId as string) ?? '',
    servedDate: (data.servedDate as string) ?? id,
    notes: (data.notes as string) ?? undefined,
    createdAt: createdAtField?.toMillis?.() ?? 0,
  }
}

export function useServingsInRange(start: string, end: string): { servings: Serving[]; loading: boolean } {
  const [servings, setServings] = useState<Serving[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const q = query(
      collection(db, 'servings'),
      where('servedDate', '>=', start),
      where('servedDate', '<=', end),
    )
    return onSnapshot(q, (snap) => {
      setServings(snap.docs.map((d) => toServing(d.id, d.data())))
      setLoading(false)
    })
  }, [start, end])

  return { servings, loading }
}

export function useServingByDate(dateKey: string | undefined): Serving | null | undefined {
  // undefined = still loading; null = no serving on that date.
  const [serving, setServing] = useState<Serving | null | undefined>(undefined)
  useEffect(() => {
    if (!dateKey) {
      setServing(null)
      return
    }
    const q = query(collection(db, 'servings'), where('servedDate', '==', dateKey))
    return onSnapshot(q, (snap) => {
      if (snap.empty) {
        setServing(null)
        return
      }
      const d = snap.docs[0]
      setServing(toServing(d.id, d.data()))
    })
  }, [dateKey])
  return serving
}

export function useServingsByMealId(libraryId: string | undefined): { servings: Serving[]; loading: boolean } {
  const [servings, setServings] = useState<Serving[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!libraryId) {
      setServings([])
      setLoading(false)
      return
    }
    const q = query(collection(db, 'servings'), where('libraryId', '==', libraryId))
    return onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => toServing(d.id, d.data()))
      list.sort((a, b) => b.servedDate.localeCompare(a.servedDate))
      setServings(list)
      setLoading(false)
    })
  }, [libraryId])

  return { servings, loading }
}

export function useUpvotes(mealId: string, currentUid?: string) {
  const [uids, setUids] = useState<string[]>([])

  useEffect(() => {
    if (!mealId) return
    return onSnapshot(collection(db, 'mealLibrary', mealId, 'upvotes'), (snap) => {
      setUids(snap.docs.map((d) => d.id))
    })
  }, [mealId])

  return {
    count: uids.length,
    upvoted: currentUid ? uids.includes(currentUid) : false,
  }
}
