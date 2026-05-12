import { HashRouter, Routes, Route } from 'react-router-dom'
import type { ReactNode } from 'react'
import { AuthProvider, useAuth } from './auth/AuthProvider'
import { SignIn } from './auth/SignIn'
import { FinishSignIn } from './auth/FinishSignIn'
import { Pending } from './auth/Pending'
import { Loading } from './components/Loading'
import { Layout } from './components/Layout'
import { Calendar } from './routes/Calendar'
import { Requests } from './routes/Requests'
import { Admin } from './routes/Admin'

function Gate({ children }: { children: ReactNode }) {
  const { fbUser, appUser, loading } = useAuth()
  if (loading) return <Loading />
  if (!fbUser) return <SignIn />
  if (!appUser) return <Loading />
  if (appUser.status !== 'approved') return <Pending />
  return <>{children}</>
}

export function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <Routes>
          <Route path="/finish-signin" element={<FinishSignIn />} />
          <Route
            element={
              <Gate>
                <Layout />
              </Gate>
            }
          >
            <Route index element={<Calendar />} />
            <Route path="requests" element={<Requests />} />
            <Route path="admin/*" element={<Admin />} />
          </Route>
        </Routes>
      </HashRouter>
    </AuthProvider>
  )
}
