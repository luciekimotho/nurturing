import { useEffect, useState } from 'react'
import type { CyclePhase } from '@nurturing/core'
import { getPhaseGuidance } from '@nurturing/core'

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:4000'

const phaseColors: Record<CyclePhase, string> = {
  menstrual: 'bg-red-50 border-red-200 text-red-800',
  follicular: 'bg-green-50 border-green-200 text-green-800',
  ovulatory: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  luteal: 'bg-purple-50 border-purple-200 text-purple-800',
}

const phaseEmoji: Record<CyclePhase, string> = {
  menstrual: '🌑',
  follicular: '🌱',
  ovulatory: '🌕',
  luteal: '🍂',
}

interface PhaseData {
  phase: CyclePhase
  guidance: ReturnType<typeof getPhaseGuidance>
  disclaimer: string
}

export default function Dashboard() {
  const [phaseData, setPhaseData] = useState<PhaseData | null>(null)
  const [phaseError, setPhaseError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`${API}/api/cycle/phase`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then(setPhaseData)
      .catch(() => setPhaseError('Log your first period to see your phase.'))
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-stone-800">Good day 👋</h1>
        <p className="text-stone-500 text-sm mt-1">Here's your daily overview.</p>
      </div>

      {/* Phase card */}
      {phaseData ? (
        <div className={`rounded-2xl border p-5 ${phaseColors[phaseData.phase]}`}>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-2xl">{phaseEmoji[phaseData.phase]}</span>
            <div>
              <p className="text-xs font-medium uppercase tracking-widest opacity-70">Current phase</p>
              <p className="text-lg font-semibold capitalize">{phaseData.phase}</p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 mt-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider mb-1.5 opacity-70">Food focus</p>
              <ul className="space-y-1">
                {phaseData.guidance.foodFocus.map((f) => (
                  <li key={f} className="text-sm flex gap-1.5 items-start">
                    <span className="mt-0.5">•</span>{f}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider mb-1.5 opacity-70">Workout focus</p>
              <ul className="space-y-1">
                {phaseData.guidance.workoutFocus.map((w) => (
                  <li key={w} className="text-sm flex gap-1.5 items-start">
                    <span className="mt-0.5">•</span>{w}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <p className="text-xs mt-4 opacity-60 italic">{phaseData.disclaimer}</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-stone-200 bg-white p-5 text-stone-500 text-sm">
          {phaseError ?? 'Loading phase data…'}
        </div>
      )}

      {/* Quick links */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { href: '/food', label: 'Log food', icon: '🥗' },
          { href: '/workouts', label: 'Log workout', icon: '💪' },
          { href: '/cycle', label: 'Log cycle', icon: '🌙' },
        ].map(({ href, label, icon }) => (
          <a
            key={href}
            href={href}
            className="flex flex-col items-center gap-2 rounded-xl bg-white border border-stone-200 p-4 hover:border-rose-300 hover:bg-rose-50 transition-colors"
          >
            <span className="text-2xl">{icon}</span>
            <span className="text-xs font-medium text-stone-600">{label}</span>
          </a>
        ))}
      </div>
    </div>
  )
}
