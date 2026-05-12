import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'

export function Admin() {
  const { appUser } = useAuth()
  if (appUser?.role !== 'amy') return <Navigate to="/" replace />
  return <Outlet />
}
