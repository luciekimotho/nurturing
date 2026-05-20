import { useEffect, useState } from 'react'
import type { CyclePhase } from '@nurturing/core'
import { getPhaseGuidance } from '@nurturing/core'
import { apiFetch } from '../lib/api'

const phaseColors: Record<CyclePhase, string> = {
  menstrual: 'bg-[#fff0eb] border-[#e8b7a6] text-[#7a3324]',
  follicular: 'bg-[#edf8f2] border-[#b7d4c8] text-[#1c5948]',
  ovulatory: 'bg-[#fff8e6] border-[#e4d0a0] text-[#7e5a13]',
  luteal: 'bg-[#f4efe8] border-[#d5c8b6] text-[#654e2e]',
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
    apiFetch('/api/cycle/phase')
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then(setPhaseData)
      .catch(() => setPhaseError('Log your first period to see your phase.'))
  }, [])

  return (
    <div className="space-y-6 page-enter">
      <div>
        <h1 className="text-4xl font-semibold">Good day, Lucie.</h1>
        <p className="text-[var(--muted)] text-sm mt-1">Your cycle-aware wellness board for today.</p>
      </div>

      {/* Phase card */}
      {phaseData ? (
        <div className={`panel rounded-3xl border p-6 ${phaseColors[phaseData.phase]}`}>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-3xl">{phaseEmoji[phaseData.phase]}</span>
            <div>
              <p className="text-xs font-medium uppercase tracking-widest opacity-70">Current phase</p>
              <p className="text-2xl font-semibold capitalize [font-family:var(--heading-font)]">{phaseData.phase}</p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-5 mt-5">
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

          <p className="text-xs mt-5 opacity-70 italic">{phaseData.disclaimer}</p>
        </div>
      ) : (
        <div className="panel rounded-2xl p-5 text-[var(--muted)] text-sm">
          {phaseError ?? 'Loading phase data…'}
        </div>
      )}

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { href: '/food', label: 'Log food', icon: '🥗' },
          { href: '/workouts', label: 'Log workout', icon: '💪' },
          { href: '/cycle', label: 'Log cycle', icon: '🌙' },
        ].map(({ href, label, icon }) => (
          <a
            key={href}
            href={href}
            className="panel flex flex-row sm:flex-col items-center justify-between sm:justify-center gap-2 rounded-xl p-4 hover:translate-y-[-2px] transition"
          >
            <span className="text-2xl">{icon}</span>
            <span className="text-xs font-medium text-[var(--ink)]">{label}</span>
          </a>
        ))}
      </div>
    </div>
  )
}
