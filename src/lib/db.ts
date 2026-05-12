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

export function useMealLibrary(): { library: MealLibraryEntry[]; loading: boolean } {
  const [library, setLibrary] = useState<MealLibraryEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const q = query(collection(db, 'mealLibrary'), orderBy('name'))
    return onSnapshot(q, (snap) => {
      setLibrary(
        snap.docs.map((d) => {
          const data = d.data()
          return {
            id: d.id,
            name: data.name ?? '',
            description: data.description ?? '',
            photoUrl: data.photoUrl,
            dietaryTags: (data.dietaryTags ?? []) as DietaryTag[],
            createdAt: data.createdAt?.toMillis?.() ?? 0,
          }
        }),
      )
      setLoading(false)
    })
  }, [])

  return { library, loading }
}

export function useLibraryEntry(id: string | undefined): MealLibraryEntry | null {
  const [entry, setEntry] = useState<MealLibraryEntry | null>(null)
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
      const data = snap.data()
      setEntry({
        id: snap.id,
        name: data.name ?? '',
        description: data.description ?? '',
        photoUrl: data.photoUrl,
        dietaryTags: (data.dietaryTags ?? []) as DietaryTag[],
        createdAt: data.createdAt?.toMillis?.() ?? 0,
      })
    })
  }, [id])
  return entry
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
      setServings(
        snap.docs.map((d) => {
          const data = d.data()
          return {
            id: d.id,
            libraryId: data.libraryId,
            servedDate: data.servedDate,
            notes: data.notes,
            createdAt: data.createdAt?.toMillis?.() ?? 0,
          }
        }),
      )
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
      const data = d.data()
      setServing({
        id: d.id,
        libraryId: data.libraryId,
        servedDate: data.servedDate,
        notes: data.notes,
        createdAt: data.createdAt?.toMillis?.() ?? 0,
      })
    })
  }, [dateKey])
  return serving
}
