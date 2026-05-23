import { useEffect, useMemo, useState } from 'react'
import type { CycleLog, CyclePhase } from '@nurturing/core'
import { getPhaseGuidance } from '@nurturing/core'
import { DayPicker } from 'react-day-picker'
import { apiFetch } from '../lib/api'
import MenstrualDropletIcon from '../components/MenstrualDropletIcon'
import OvulatorySparkIcon from '../components/OvulatorySparkIcon'
import { formatReadableDate, getCyclePhaseForDate, isPeriodDay } from '../lib/cycle'
import 'react-day-picker/style.css'

const phaseColors: Record<CyclePhase, string> = {
  menstrual: 'bg-[linear-gradient(160deg,#fff7f8_0%,#f7e4e8_100%)] border-[#e2c0ca] text-[#7d3044]',
  follicular: 'bg-[linear-gradient(160deg,#f1faf6_0%,#dff0e8_100%)] border-[#bedaca] text-[#226454]',
  ovulatory: 'bg-[linear-gradient(160deg,#fffaf0_0%,#f7e8bb_100%)] border-[#e7cf88] text-[#856112]',
  luteal: 'bg-[linear-gradient(160deg,#fbf4ee_0%,#f0dcc9_100%)] border-[#e0c8b4] text-[#805032]',
}

const phaseEmoji: Record<CyclePhase, string> = {
  menstrual: '',
  follicular: '🌱',
  ovulatory: '',
  luteal: '🍂',
}

interface PhaseData {
  phase: CyclePhase
  guidance: ReturnType<typeof getPhaseGuidance>
  disclaimer: string
}

const phaseLabels: Record<CyclePhase, string> = {
  menstrual: 'Menstrual',
  follicular: 'Follicular',
  ovulatory: 'Ovulatory',
  luteal: 'Luteal',
}

export default function Dashboard() {
  const [phaseData, setPhaseData] = useState<PhaseData | null>(null)
  const [cycleLogs, setCycleLogs] = useState<CycleLog[]>([])
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [phaseError, setPhaseError] = useState<string | null>(null)

  useEffect(() => {
    apiFetch('/api/cycle/phase')
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then(setPhaseData)
      .catch(() => setPhaseError('Log your first period to see your phase.'))

    apiFetch('/api/cycle')
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then(setCycleLogs)
      .catch(() => setCycleLogs([]))
  }, [])

  const selectedDatePhase = useMemo(() => getCyclePhaseForDate(selectedDate, cycleLogs), [selectedDate, cycleLogs])

  return (
    <div className="space-y-6 page-enter">
      <div className="grid md:grid-cols-[1fr_1.2fr] gap-4 items-start">
        <div className="panel p-5 sm:p-6 bg-[linear-gradient(145deg,#fff8ee_0%,#f6e6d7_100%)]">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">Today</p>
          <h1 className="text-4xl font-semibold mt-1">Hello, Lucie.</h1>
          <div className="mt-5">
            <div className="nurturing-datepicker rounded-2xl border border-[var(--line)] bg-white/70 p-3">
              <DayPicker
                mode="single"
                selected={selectedDate}
                onSelect={(day) => {
                  if (day) setSelectedDate(day)
                }}
                disabled={{ after: new Date() }}
                modifiers={{
                  loggedPeriod: (day) => isPeriodDay(day, cycleLogs),
                }}
                modifiersClassNames={{
                  loggedPeriod: 'period-logged-day',
                }}
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {/* Phase card */}
          {phaseData ? (
            <div className={`panel rounded-3xl border p-6 ${phaseColors[phaseData.phase]}`}>
              <div className="grid lg:grid-cols-[240px_1fr] gap-6 items-center">
                <div className="text-center">
                  <div className={`phase-ring phase-ring--${phaseData.phase} flex items-center justify-center`}>
                    <div className="phase-ring-stack px-6">
                      <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)] leading-none">Current phase</p>
                      <p className="text-3xl font-semibold capitalize [font-family:var(--heading-font)] leading-none">{phaseData.phase}</p>
                      <div className="phase-ring-icon-row">
                        {phaseData.phase === 'menstrual' ? (
                          <MenstrualDropletIcon className="h-10 w-10 text-[#a83050] drop-shadow-[0_1px_0_rgba(255,255,255,0.45)]" />
                        ) : phaseData.phase === 'ovulatory' ? (
                          <OvulatorySparkIcon className="h-10 w-10 text-[#c89020] drop-shadow-[0_1px_0_rgba(255,255,255,0.45)]" />
                        ) : (
                          <p className="text-3xl leading-none">{phaseEmoji[phaseData.phase]}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="grid sm:grid-cols-2 gap-5 mt-2">
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
              </div>
            </div>

          ) : (
            <div className="panel rounded-2xl p-5 text-[var(--muted)] text-sm">
              {phaseError ?? 'Loading phase data…'}
            </div>
          )}

          <div className="rounded-2xl border border-[var(--line)] bg-white/70 p-3">
            <p className="text-sm font-semibold mt-1 text-[var(--ink)]">{formatReadableDate(selectedDate)}</p>
            {selectedDatePhase ? (
              <span className="inline-flex mt-2 rounded-full border border-[var(--line)] bg-white/75 px-2.5 py-1 text-xs font-semibold text-[var(--ink)] shadow-sm">
                {phaseLabels[selectedDatePhase]}
              </span>
            ) : (
              <p className="text-xs text-[var(--muted)] mt-2">No phase data yet. Log a period to start mapping.</p>
            )}
          </div>
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { href: '/food', label: 'Log food', icon: '🥗', note: 'Keep energy steady' },
          { href: '/workouts', label: 'Log workout', icon: '💪', note: 'Track movement and recovery' },
          { href: '/cycle', label: 'Log cycle', icon: '🌙', note: 'Add symptoms and period dates' },
        ].map(({ href, label, icon, note }) => (
          <a
            key={href}
            href={href}
            className="panel flex flex-row sm:flex-col items-center justify-between sm:justify-center gap-2 rounded-2xl p-4 hover:translate-y-[-2px] transition"
          >
            <span className="text-2xl">{icon}</span>
            <div className="text-right sm:text-center">
              <p className="text-xs font-medium text-[var(--ink)]">{label}</p>
              <p className="text-[11px] text-[var(--muted)]">{note}</p>
            </div>
          </a>
        ))}
      </div>
    </div>
  )
}
