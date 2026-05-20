import { useEffect, useState } from 'react'
import type { CycleLog, Symptom } from '@nurturing/core'
import { CycleLogSchema, SymptomSchema } from '@nurturing/schemas'

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
  const [submittingCycle, setSubmittingCycle] = useState(false)
  const [submittingSymptom, setSubmittingSymptom] = useState(false)

  const fetchAll = () => Promise.all([
    fetch(`${API}/api/cycle`).then((r) => r.json()).then(setCycleLogs),
    fetch(`${API}/api/cycle/symptoms`).then((r) => r.json()).then(setSymptoms),
  ])

  useEffect(() => { fetchAll() }, [])

  async function handleCycleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const payload = {
      periodStart: new Date(periodStart).toISOString(),
      periodEnd: periodEnd ? new Date(periodEnd).toISOString() : undefined,
    }
    const result = CycleLogSchema.safeParse(payload)
    if (!result.success) {
      const flat = result.error.flatten().fieldErrors
      setCycleErrors(Object.fromEntries(Object.entries(flat).map(([k, v]) => [k, v?.[0] ?? ''])))
      return
    }
    setSubmittingCycle(true)
    await fetch(`${API}/api/cycle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    setPeriodStart('')
    setPeriodEnd('')
    await fetchAll()
    setSubmittingCycle(false)
  }

  async function handleSymptomSubmit(e: React.FormEvent) {
    e.preventDefault()
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
    await fetch(`${API}/api/cycle/symptoms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    setSymptomType('')
    setSymptomSeverity(3)
    await fetchAll()
    setSubmittingSymptom(false)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-stone-800">Cycle Tracking</h1>
        <p className="text-stone-500 text-sm mt-1">Log your period and symptoms.</p>
      </div>

      {/* Log period form */}
      <form onSubmit={handleCycleSubmit} className="bg-white border border-stone-200 rounded-2xl p-5 space-y-4">
        <h2 className="font-medium text-stone-700">Log a period</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-stone-600 mb-1">Period start *</label>
            <input
              type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)}
              className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
            />
            {cycleErrors.periodStart && <p className="text-xs text-red-500 mt-1">{cycleErrors.periodStart}</p>}
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-600 mb-1">Period end (optional)</label>
            <input
              type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)}
              className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
            />
          </div>
        </div>
        <button
          type="submit" disabled={submittingCycle}
          className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
        >
          {submittingCycle ? 'Saving…' : 'Save period'}
        </button>
      </form>

      {/* Log symptom form */}
      <form onSubmit={handleSymptomSubmit} className="bg-white border border-stone-200 rounded-2xl p-5 space-y-4">
        <h2 className="font-medium text-stone-700">Log a symptom</h2>

        <div>
          <label className="block text-xs font-medium text-stone-600 mb-2">Quick select</label>
          <div className="flex flex-wrap gap-2">
            {commonSymptoms.map((s) => (
              <button
                key={s} type="button"
                onClick={() => setSymptomType(s)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                  symptomType === s
                    ? 'bg-rose-100 border-rose-300 text-rose-700'
                    : 'border-stone-200 text-stone-500 hover:border-rose-200 hover:text-rose-600'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-stone-600 mb-1">Symptom *</label>
            <input
              value={symptomType} onChange={(e) => setSymptomType(e.target.value)}
              placeholder="Or type custom symptom"
              className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
            />
            {symptomErrors.type && <p className="text-xs text-red-500 mt-1">{symptomErrors.type}</p>}
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-600 mb-1">Severity (1–5) *</label>
            <div className="flex gap-2 mt-1">
              {([1, 2, 3, 4, 5] as const).map((n) => (
                <button
                  key={n} type="button"
                  onClick={() => setSymptomSeverity(n)}
                  className={`w-9 h-9 rounded-full text-sm font-medium border transition-colors ${
                    symptomSeverity === n
                      ? 'bg-rose-600 border-rose-600 text-white'
                      : 'border-stone-200 text-stone-500 hover:border-rose-300'
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
          className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
        >
          {submittingSymptom ? 'Saving…' : 'Log symptom'}
        </button>
      </form>

      {/* Cycle history */}
      {cycleLogs.length > 0 && (
        <div>
          <h2 className="font-medium text-stone-700 mb-2">Period history</h2>
          <div className="space-y-2">
            {cycleLogs.map((log) => (
              <div key={log.id} className="bg-white border border-stone-200 rounded-xl px-4 py-3 text-sm">
                <span className="font-medium text-stone-700">
                  {new Date(log.periodStart).toLocaleDateString()}
                </span>
                {log.periodEnd && (
                  <span className="text-stone-400"> → {new Date(log.periodEnd).toLocaleDateString()}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Symptoms history */}
      {symptoms.length > 0 && (
        <div>
          <h2 className="font-medium text-stone-700 mb-2">Recent symptoms</h2>
          <div className="space-y-2">
            {symptoms.map((s) => (
              <div key={s.id} className="flex items-center justify-between bg-white border border-stone-200 rounded-xl px-4 py-3">
                <span className="text-sm text-stone-700">{s.type}</span>
                <div className="flex gap-0.5">
                  {([1, 2, 3, 4, 5] as const).map((n) => (
                    <span key={n} className={`w-2.5 h-2.5 rounded-full ${n <= s.severity ? 'bg-rose-400' : 'bg-stone-100'}`} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="text-xs text-stone-400 italic">
        This app provides general wellness information only, not medical advice.
      </p>
    </div>
  )
}
