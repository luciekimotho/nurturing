import { useEffect, useState } from 'react'
import type { CycleLog, Symptom } from '@nurturing/core'
import { CycleLogSchema, SymptomSchema } from '@nurturing/schemas'
import DatePickerField from '../components/DatePickerField'

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:4000'

const commonSymptoms = ['Cramps', 'Bloating', 'Fatigue', 'Headache', 'Mood swings', 'Breast tenderness', 'Spotting', 'Back pain']

export default function CycleTracking() {
  const [cycleLogs, setCycleLogs] = useState<CycleLog[]>([])
  const [symptoms, setSymptoms] = useState<Symptom[]>([])
  const [periodStart, setPeriodStart] = useState('')
  const [periodEnd, setPeriodEnd] = useState('')
  const [cycleErrors, setCycleErrors] = useState<Record<string, string>>({})
  const [symptomType, setSymptomType] = useState('')
  const [symptomSeverity, setSymptomSeverity] = useState<1 | 2 | 3 | 4 | 5>(3)
  const [symptomErrors, setSymptomErrors] = useState<Record<string, string>>({})
  const [requestError, setRequestError] = useState<string | null>(null)
  const [submittingCycle, setSubmittingCycle] = useState(false)
  const [submittingSymptom, setSubmittingSymptom] = useState(false)

  const fetchAll = () => Promise.all([
    fetch(`${API}/api/cycle`).then((r) => r.json()).then(setCycleLogs),
    fetch(`${API}/api/cycle/symptoms`).then((r) => r.json()).then(setSymptoms),
  ])

  useEffect(() => { fetchAll() }, [])

  async function handleCycleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setRequestError(null)

    if (!periodStart) {
      setCycleErrors({ periodStart: 'Period start is required' })
      return
    }

    const startDate = new Date(periodStart)
    if (Number.isNaN(startDate.getTime())) {
      setCycleErrors({ periodStart: 'Enter a valid period start date' })
      return
    }

    const endDate = periodEnd ? new Date(periodEnd) : null
    if (endDate && Number.isNaN(endDate.getTime())) {
      setCycleErrors({ periodEnd: 'Enter a valid period end date' })
      return
    }

    const payload = {
      periodStart: startDate.toISOString(),
      periodEnd: endDate ? endDate.toISOString() : undefined,
    }
    const result = CycleLogSchema.safeParse(payload)
    if (!result.success) {
      const flat = result.error.flatten().fieldErrors
      setCycleErrors(Object.fromEntries(Object.entries(flat).map(([k, v]) => [k, v?.[0] ?? ''])))
      return
    }
    setSubmittingCycle(true)
    try {
      const res = await fetch(`${API}/api/cycle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        setRequestError('Could not save cycle entry. Please try again.')
        return
      }

      setPeriodStart('')
      setPeriodEnd('')
      setCycleErrors({})
      await fetchAll()
    } catch {
      setRequestError('Network issue while saving cycle entry. Please try again.')
    } finally {
      setSubmittingCycle(false)
    }
  }

  async function handleSymptomSubmit(e: React.FormEvent) {
    e.preventDefault()
    setRequestError(null)
    const payload = {
      date: new Date().toISOString(),
      type: symptomType,
      severity: symptomSeverity,
    }
    const result = SymptomSchema.safeParse(payload)
    if (!result.success) {
      const flat = result.error.flatten().fieldErrors
      setSymptomErrors(Object.fromEntries(Object.entries(flat).map(([k, v]) => [k, v?.[0] ?? ''])))
      return
    }
    setSubmittingSymptom(true)
    try {
      const res = await fetch(`${API}/api/cycle/symptoms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        setRequestError('Could not save symptom entry. Please try again.')
        return
      }

      setSymptomType('')
      setSymptomSeverity(3)
      setSymptomErrors({})
      await fetchAll()
    } catch {
      setRequestError('Network issue while saving symptom entry. Please try again.')
    } finally {
      setSubmittingSymptom(false)
    }
  }

  return (
    <div className="space-y-6 page-enter">
      <div>
        <h1 className="text-4xl font-semibold">Cycle Tracking</h1>
        <p className="text-[var(--muted)] text-sm mt-1">Log your period and symptoms.</p>
        {requestError && <p className="text-sm text-red-600 mt-2">{requestError}</p>}
      </div>

      {/* Log period form */}
      <form onSubmit={handleCycleSubmit} className="panel p-5 space-y-4">
        <h2 className="text-xl font-medium">Log a period</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <DatePickerField
              label="Period start"
              value={periodStart}
              onChange={setPeriodStart}
              required
            />
            {cycleErrors.periodStart && <p className="text-xs text-red-500 mt-1">{cycleErrors.periodStart}</p>}
          </div>
          <div>
            <DatePickerField
              label="Period end (optional)"
              value={periodEnd}
              onChange={setPeriodEnd}
            />
            {cycleErrors.periodEnd && <p className="text-xs text-red-500 mt-1">{cycleErrors.periodEnd}</p>}
          </div>
        </div>
        <button
          type="submit" disabled={submittingCycle}
          className="primary-btn"
        >
          {submittingCycle ? 'Saving…' : 'Save period'}
        </button>
      </form>

      {/* Log symptom form */}
      <form onSubmit={handleSymptomSubmit} className="panel p-5 space-y-4">
        <h2 className="text-xl font-medium">Log a symptom</h2>

        <div>
          <label className="block text-xs font-medium text-[var(--muted)] mb-2">Quick select</label>
          <div className="flex flex-wrap gap-2">
            {commonSymptoms.map((s) => (
              <button
                key={s} type="button"
                onClick={() => setSymptomType(s)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                  symptomType === s
                    ? 'bg-[var(--brand-soft)] border-[#daa990] text-[var(--brand)]'
                    : 'border-[var(--line)] text-[var(--muted)] hover:border-[#daa990] hover:text-[var(--brand)]'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-[var(--muted)] mb-1">Symptom *</label>
            <input
              value={symptomType} onChange={(e) => setSymptomType(e.target.value)}
              placeholder="Or type custom symptom"
              className="field"
            />
            {symptomErrors.type && <p className="text-xs text-red-500 mt-1">{symptomErrors.type}</p>}
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--muted)] mb-1">Severity (1-5) *</label>
            <div className="flex gap-2 mt-1">
              {([1, 2, 3, 4, 5] as const).map((n) => (
                <button
                  key={n} type="button"
                  onClick={() => setSymptomSeverity(n)}
                  className={`w-9 h-9 rounded-full text-sm font-medium border transition-colors ${
                    symptomSeverity === n
                      ? 'bg-[var(--brand)] border-[var(--brand)] text-white'
                      : 'border-[var(--line)] text-[var(--muted)] hover:border-[#daa990]'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          type="submit" disabled={submittingSymptom}
          className="primary-btn"
        >
          {submittingSymptom ? 'Saving…' : 'Log symptom'}
        </button>
      </form>

      {/* Cycle history */}
      {cycleLogs.length > 0 && (
        <div>
          <h2 className="text-lg font-medium mb-2">Period history</h2>
          <div className="space-y-2">
            {cycleLogs.map((log) => (
              <div key={log.id} className="panel rounded-xl px-4 py-3 text-sm">
                <span className="font-medium text-[var(--ink)]">
                  {new Date(log.periodStart).toLocaleDateString()}
                </span>
                {log.periodEnd && (
                  <span className="text-[var(--muted)]"> {'->'} {new Date(log.periodEnd).toLocaleDateString()}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Symptoms history */}
      {symptoms.length > 0 && (
        <div>
          <h2 className="text-lg font-medium mb-2">Recent symptoms</h2>
          <div className="space-y-2">
            {symptoms.map((s) => (
              <div key={s.id} className="panel flex items-center justify-between rounded-xl px-4 py-3">
                <span className="text-sm text-[var(--ink)]">{s.type}</span>
                <div className="flex gap-0.5">
                  {([1, 2, 3, 4, 5] as const).map((n) => (
                    <span key={n} className={`w-2.5 h-2.5 rounded-full ${n <= s.severity ? 'bg-[#cb5f45]' : 'bg-[#eadfce]'}`} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="text-xs text-[var(--muted)] italic">
        This app provides general wellness information only, not medical advice.
      </p>
    </div>
  )
}
