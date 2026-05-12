import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
} from 'firebase/firestore'
import { db } from '../../firebase'
import type { AppUser, UserStatus } from '../../types'

export function Employees() {
  const navigate = useNavigate()
  const [users, setUsers] = useState<AppUser[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'))
    return onSnapshot(q, (snap) => {
      setUsers(
        snap.docs.map((d) => {
          const data = d.data()
          return {
            uid: d.id,
            email: data.email,
            displayName: data.displayName,
            role: data.role,
            status: data.status,
            createdAt: data.createdAt?.toMillis?.() ?? 0,
          }
        }),
      )
      setLoading(false)
    })
  }, [])

  async function setStatus(uid: string, status: UserStatus) {
    await updateDoc(doc(db, 'users', uid), { status })
  }

  const pending = users.filter((u) => u.status === 'pending')
  const approved = users.filter((u) => u.status === 'approved')
  const deactivated = users.filter((u) => u.status === 'deactivated')

  return (
    <div className="py-4 space-y-4">
      <div className="flex items-center justify-between">
        <button className="btn-ghost px-2" onClick={() => navigate(-1)}>
          ← Back
        </button>
        <h2 className="text-2xl">Employees</h2>
        <span aria-hidden className="w-12" />
      </div>

      {loading && <div className="card text-sm text-ink-500">Loading…</div>}

      <Section title={`Waiting to be approved (${pending.length})`} empty="No one is waiting.">
        {pending.map((u) => (
          <UserRow
            key={u.uid}
            user={u}
            actions={
              <>
                <button className="btn-primary text-sm px-3 py-2" onClick={() => setStatus(u.uid, 'approved')}>
                  Approve
                </button>
                <button className="btn-ghost text-sm px-3 py-2" onClick={() => setStatus(u.uid, 'deactivated')}>
                  Reject
                </button>
              </>
            }
          />
        ))}
      </Section>

      <Section title={`Active (${approved.length})`} empty="No active employees yet.">
        {approved.map((u) => (
          <UserRow
            key={u.uid}
            user={u}
            actions={
              u.role === 'amy' ? (
                <span className="text-xs font-semibold text-terracotta-600">admin</span>
              ) : (
                <button
                  className="btn-ghost text-sm px-3 py-2 text-terracotta-700"
                  onClick={() => setStatus(u.uid, 'deactivated')}
                >
                  Deactivate
                </button>
              )
            }
          />
        ))}
      </Section>

      {deactivated.length > 0 && (
        <Section title={`Deactivated (${deactivated.length})`} empty="">
          {deactivated.map((u) => (
            <UserRow
              key={u.uid}
              user={u}
              actions={
                <button className="btn-secondary text-sm px-3 py-2" onClick={() => setStatus(u.uid, 'approved')}>
                  Reactivate
                </button>
              }
            />
          ))}
        </Section>
      )}
    </div>
  )
}

function Section({
  title,
  empty,
  children,
}: {
  title: string
  empty: string
  children: React.ReactNode
}) {
  const hasChildren = Array.isArray(children) ? children.length > 0 : !!children
  return (
    <section>
      <h3 className="text-sm font-semibold text-ink-500 uppercase tracking-wide mb-2 px-1">
        {title}
      </h3>
      {!hasChildren && empty ? (
        <div className="card text-sm text-ink-500">{empty}</div>
      ) : (
        <div className="space-y-2">{children}</div>
      )}
    </section>
  )
}

function UserRow({ user, actions }: { user: AppUser; actions: React.ReactNode }) {
  return (
    <div className="card flex items-center gap-3">
      <div className="w-10 h-10 rounded-full bg-cream-200 flex items-center justify-center font-semibold text-ink-700">
        {(user.displayName || user.email).charAt(0).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold truncate">{user.displayName}</div>
        <div className="text-xs text-ink-500 truncate">{user.email}</div>
      </div>
      <div className="flex items-center gap-2">{actions}</div>
    </div>
  )
}
