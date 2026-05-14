import { HashRouter, Routes, Route } from 'react-router-dom'
import type { ReactNode } from 'react'
import { AuthProvider, useAuth } from './auth/AuthProvider'
import { SignIn } from './auth/SignIn'
import { FinishSignIn } from './auth/FinishSignIn'
import { Pending } from './auth/Pending'
import { UsersProvider } from './lib/users'
import { Loading } from './components/Loading'
import { Layout } from './components/Layout'
import { Calendar } from './routes/Calendar'
import { DayDetail } from './routes/DayDetail'
import { Meals } from './routes/Meals'
import { MealDetail } from './routes/MealDetail'
import { EditMeal } from './routes/EditMeal'
import { ScheduleMeal } from './routes/ScheduleMeal'
import { About } from './routes/About'
import { Admin } from './routes/Admin'
import { AdminHome } from './routes/admin/AdminHome'
import { Employees } from './routes/admin/Employees'
import { Reports } from './routes/admin/Reports'
import { Poster } from './routes/admin/Poster'

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
                <UsersProvider>
                  <Layout />
                </UsersProvider>
              </Gate>
            }
          >
            <Route index element={<Calendar />} />
            <Route path="day/:date" element={<DayDetail />} />
            <Route path="meals" element={<Meals />} />
            <Route path="meals/new" element={<EditMeal />} />
            <Route path="meals/:id" element={<MealDetail />} />
            <Route path="meals/:id/edit" element={<EditMeal />} />
            <Route path="schedule/:date" element={<ScheduleMeal />} />
            <Route path="reports" element={<Reports />} />
            <Route path="about" element={<About />} />
            <Route path="admin" element={<Admin />}>
              <Route index element={<AdminHome />} />
              <Route path="employees" element={<Employees />} />
              <Route path="poster" element={<Poster />} />
            </Route>
          </Route>
        </Routes>
      </HashRouter>
    </AuthProvider>
  )
}
