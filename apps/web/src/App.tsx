import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import FoodLog from './pages/FoodLog'
import WorkoutLog from './pages/WorkoutLog'
import CycleTracking from './pages/CycleTracking'

export default function App() {
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
