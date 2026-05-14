import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { onAuthStateChanged, signOut, type User } from 'firebase/auth'
import { doc, getDoc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore'
import { auth, db } from '../firebase'
import type { AppUser } from '../types'
import { isAllowedEmail } from '../lib/allowedDomains'

interface AuthContextValue {
  fbUser: User | null
  appUser: AppUser | null
  loading: boolean
  rejected: { email: string } | null
  clearRejected: () => void
}

const AuthContext = createContext<AuthContextValue>({
  fbUser: null,
  appUser: null,
  loading: true,
  rejected: null,
  clearRejected: () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [fbUser, setFbUser] = useState<User | null>(null)
  const [appUser, setAppUser] = useState<AppUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [rejected, setRejected] = useState<{ email: string } | null>(null)

  const clearRejected = useCallback(() => setRejected(null), [])

  useEffect(() => {
    let unsubDoc: (() => void) | null = null

    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      if (unsubDoc) {
        unsubDoc()
        unsubDoc = null
      }
      if (!user) {
        setFbUser(null)
        setAppUser(null)
        setLoading(false)
        return
      }

      if (!isAllowedEmail(user.email)) {
        setRejected({ email: user.email ?? '' })
        await signOut(auth)
        return
      }

      setFbUser(user)
      setRejected(null)

      const ref = doc(db, 'users', user.uid)
      const snap = await getDoc(ref)
      if (!snap.exists()) {
        const fallbackName = user.email ? user.email.split('@')[0] : 'Member'
        await setDoc(ref, {
          email: user.email ?? '',
          displayName: user.displayName || fallbackName,
          role: 'employee',
          status: 'pending',
          createdAt: serverTimestamp(),
        })
      }

      unsubDoc = onSnapshot(ref, (s) => {
        if (s.exists()) {
          const data = s.data()
          setAppUser({
            uid: user.uid,
            email: data.email,
            displayName: data.displayName,
            role: data.role,
            status: data.status,
            createdAt: data.createdAt?.toMillis?.() ?? 0,
          })
        }
        setLoading(false)
      })
    })

    return () => {
      unsubAuth()
      if (unsubDoc) unsubDoc()
    }
  }, [])

  return (
    <AuthContext.Provider value={{ fbUser, appUser, loading, rejected, clearRejected }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
