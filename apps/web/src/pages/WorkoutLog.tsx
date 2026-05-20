import { useEffect, useState } from 'react'
import type { WorkoutLog } from '@nurturing/core'
import { WorkoutLogSchema } from '@nurturing/schemas'

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:4000'

const intensityLevels = ['low', 'moderate', 'high'] as const

const emptyForm = {
  type: '',
  durationMinutes: '',
  intensityLevel: 'moderate' as typeof intensityLevels[number],
  notes: '',
}

export default function WorkoutLog() {
  const [logs, setLogs] = useState<WorkoutLog[]>([])
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  const fetchLogs = () =>
    fetch(`${API}/api/workouts`).then((r) => r.json()).then(setLogs)

  useEffect(() => { fetchLogs() }, [])

  const totalMinutes = logs.reduce((sum, l) => sum + l.durationMinutes, 0)

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
    setErrors((err) => ({ ...err, [e.target.name]: '' }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const payload = {
      type: form.type,
      durationMinutes: Number(form.durationMinutes),
      intensityLevel: form.intensityLevel,
      notes: form.notes || undefined,
      loggedAt: new Date().toISOString(),
    }
    const result = WorkoutLogSchema.safeParse(payload)
    if (!result.success) {
      const flat = result.error.flatten().fieldErrors
      setErrors(Object.fromEntries(Object.entries(flat).map(([k, v]) => [k, v?.[0] ?? ''])))
      return
    }
    setSubmitting(true)
    await fetch(`${API}/api/workouts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    setForm(emptyForm)
    await fetchLogs()
    setSubmitting(false)
  }

  async function handleDelete(id: string) {
    await fetch(`${API}/api/workouts/${id}`, { method: 'DELETE' })
    setLogs((l) => l.filter((x) => x.id !== id))
  }

  const intensityColor = { low: 'bg-green-100 text-green-700', moderate: 'bg-yellow-100 text-yellow-700', high: 'bg-red-100 text-red-700' }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-stone-800">Workouts</h1>
        {logs.length > 0 && (
          <p className="text-stone-500 text-sm mt-1">{totalMinutes} min logged</p>
        )}
      </div>

      {/* Add workout form */}
      <form onSubmit={handleSubmit} className="bg-white border border-stone-200 rounded-2xl p-5 space-y-4">
        <h2 className="font-medium text-stone-700">Log a workout</h2>

        <div className="grid sm:grid-cols-3 gap-3">
          <div className="sm:col-span-1">
            <label className="block text-xs font-medium text-stone-600 mb-1">Workout type *</label>
            <input
              name="type" value={form.type} onChange={handleChange}
              placeholder="e.g. Running, Yoga"
              className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
            />
            {errors.type && <p className="text-xs text-red-500 mt-1">{errors.type}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-600 mb-1">Duration (min) *</label>
            <input
              name="durationMinutes" value={form.durationMinutes} onChange={handleChange}
              type="number" min="1" placeholder="30"
              className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
            />
            {errors.durationMinutes && <p className="text-xs text-red-500 mt-1">{errors.durationMinutes}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-600 mb-1">Intensity *</label>
            <select
              name="intensityLevel" value={form.intensityLevel} onChange={handleChange}
              className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
            >
              {intensityLevels.map((i) => <option key={i} value={i}>{i}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-stone-600 mb-1">Notes</label>
          <textarea
            name="notes" value={form.notes} onChange={handleChange}
            placeholder="How did it feel?"
            rows={2}
            className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300 resize-none"
          />
        </div>

        <button
          type="submit" disabled={submitting}
          className="w-full sm:w-auto px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
        >
          {submitting ? 'Saving…' : 'Log workout'}
        </button>
      </form>

      {/* Log list */}
      {logs.length === 0 ? (
        <p className="text-stone-400 text-sm text-center py-8">No workouts logged yet.</p>
      ) : (
        <div className="space-y-2">
          {logs.map((log) => (
            <div key={log.id} className="flex items-center justify-between bg-white border border-stone-200 rounded-xl px-4 py-3">
              <div>
                <p className="font-medium text-stone-800 text-sm">{log.type}</p>
                <p className="text-xs text-stone-400">
                  {log.durationMinutes} min ·{' '}
                  <span className={`inline-block px-1.5 py-0.5 rounded text-xs font-medium ${intensityColor[log.intensityLevel]}`}>
                    {log.intensityLevel}
                  </span>
                  {log.notes && ` · ${log.notes}`}
                </p>
              </div>
              <button onClick={() => handleDelete(log.id)} className="text-stone-300 hover:text-red-400 transition-colors text-lg leading-none">×</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
