import { createContext, createElement, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'
import type { AppUser } from '../types'

interface UsersContextValue {
  users: Map<string, AppUser>
  loading: boolean
}

const UsersContext = createContext<UsersContextValue>({
  users: new Map(),
  loading: true,
})

export function UsersProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<Map<string, AppUser>>(new Map())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    return onSnapshot(collection(db, 'users'), (snap) => {
      const map = new Map<string, AppUser>()
      for (const d of snap.docs) {
        const data = d.data()
        map.set(d.id, {
          uid: d.id,
          email: data.email ?? '',
          displayName: data.displayName ?? '',
          role: data.role ?? 'employee',
          status: data.status ?? 'pending',
          createdAt: data.createdAt?.toMillis?.() ?? 0,
        })
      }
      setUsers(map)
      setLoading(false)
    })
  }, [])

  const value = useMemo(() => ({ users, loading }), [users, loading])
  return createElement(UsersContext.Provider, { value }, children)
}

export function useUsers() {
  return useContext(UsersContext)
}

/**
 * Look up a user's current display name by uid, with a fallback for
 * old denormalized values stored on the document and a final default.
 */
export function useDisplayName(uid: string | undefined, storedFallback?: string): string {
  const { users } = useUsers()
  if (!uid) return storedFallback || 'Member'
  return users.get(uid)?.displayName || storedFallback || 'Member'
}
