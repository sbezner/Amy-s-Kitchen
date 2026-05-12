import { HashRouter, Routes, Route } from 'react-router-dom'
import type { ReactNode } from 'react'
import { AuthProvider, useAuth } from './auth/AuthProvider'
import { SignIn } from './auth/SignIn'
import { FinishSignIn } from './auth/FinishSignIn'
import { Pending } from './auth/Pending'
import { Loading } from './components/Loading'
import { Layout } from './components/Layout'
import { Calendar } from './routes/Calendar'
import { DayDetail } from './routes/DayDetail'
import { Requests } from './routes/Requests'
import { Admin } from './routes/Admin'
import { AdminHome } from './routes/admin/AdminHome'
import { MealLibrary } from './routes/admin/MealLibrary'
import { EditMeal } from './routes/admin/EditMeal'
import { ScheduleMeal } from './routes/admin/ScheduleMeal'
import { Employees } from './routes/admin/Employees'

function Gate({ children }: { children: ReactNode }) {
  const { fbUser, appUser, loading } = useAuth()
  if (loading) return <Loading />
  if (!fbUser) return <SignIn />
  if (!appUser) return <Loading />
  if (appUser.status !== 'approved') return <Pending />
  return <>{children}</>
}

function ComingSoon({ title }: { title: string }) {
  return (
    <div className="py-4">
      <div className="card">
        <h2 className="text-xl mb-2">{title}</h2>
        <p className="text-ink-700 text-sm">Coming next in the build.</p>
      </div>
    </div>
  )
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
            <Route path="day/:date" element={<DayDetail />} />
            <Route path="requests" element={<Requests />} />
            <Route path="admin" element={<Admin />}>
              <Route index element={<AdminHome />} />
              <Route path="meals" element={<MealLibrary />} />
              <Route path="meals/new" element={<EditMeal />} />
              <Route path="meals/:id" element={<EditMeal />} />
              <Route path="schedule/:date" element={<ScheduleMeal />} />
              <Route path="employees" element={<Employees />} />
              <Route path="requests" element={<ComingSoon title="Requests admin" />} />
              <Route path="reports" element={<ComingSoon title="Reports" />} />
            </Route>
          </Route>
        </Routes>
      </HashRouter>
    </AuthProvider>
  )
}
