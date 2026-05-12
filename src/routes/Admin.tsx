import { useAuth } from '../auth/AuthProvider'
import { Navigate } from 'react-router-dom'

export function Admin() {
  const { appUser } = useAuth()
  if (appUser?.role !== 'amy') return <Navigate to="/" replace />

  return (
    <div className="py-4 space-y-4">
      <div className="card">
        <h2 className="text-xl mb-2">Admin</h2>
        <p className="text-ink-700 text-sm">
          Approve sign-ups, post meals, manage requests, and view reports. Coming next in the build.
        </p>
      </div>
    </div>
  )
}
