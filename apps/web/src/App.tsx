import { useEffect } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { SignedIn, SignedOut, SignIn, SignUp, RedirectToSignIn } from '@clerk/clerk-react'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import FoodLog from './pages/FoodLog'
import WorkoutLog from './pages/WorkoutLog'
import CycleTracking from './pages/CycleTracking'
import { isClerkAuth } from './lib/auth'

const TITLE_SUFFIX = 'Daily rhythm companion'

function getPageTitle(pathname: string) {
  if (pathname === '/' || pathname === '/dashboard') return 'Nurturing'
  if (pathname.startsWith('/food')) return 'Food'
  if (pathname.startsWith('/workouts')) return 'Workouts'
  if (pathname.startsWith('/cycle')) return 'Cycle'
  if (pathname.startsWith('/sign-in')) return 'Sign in'
  if (pathname.startsWith('/sign-up')) return 'Sign up'
  return 'Nurturing'
}

function ProtectedLayout() {
  return (
    <>
      <SignedIn>
        <Layout />
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  )
}

export default function App() {
  const location = useLocation()

  useEffect(() => {
    document.title = `${getPageTitle(location.pathname)} | ${TITLE_SUFFIX}`
  }, [location.pathname])

  if (isClerkAuth) {
    return (
      <Routes>
        <Route path="/sign-in/*" element={<SignIn routing="path" path="/sign-in" signUpUrl="/sign-up" />} />
        <Route path="/sign-up/*" element={<SignUp routing="path" path="/sign-up" signInUrl="/sign-in" />} />
        <Route path="/" element={<ProtectedLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="food" element={<FoodLog />} />
          <Route path="workouts" element={<WorkoutLog />} />
          <Route path="cycle" element={<CycleTracking />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    )
  }

  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="food" element={<FoodLog />} />
        <Route path="workouts" element={<WorkoutLog />} />
        <Route path="cycle" element={<CycleTracking />} />
      </Route>
    </Routes>
  )
}
