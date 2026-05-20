import { Routes, Route, Navigate } from 'react-router-dom'
import { SignedIn, SignedOut, SignIn, SignUp, RedirectToSignIn } from '@clerk/clerk-react'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import FoodLog from './pages/FoodLog'
import WorkoutLog from './pages/WorkoutLog'
import CycleTracking from './pages/CycleTracking'
import { isClerkAuth } from './lib/auth'

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
