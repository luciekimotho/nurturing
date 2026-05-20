import { useEffect, useState } from 'react'
import type { WorkoutLog } from '@nurturing/core'
import { WorkoutLogSchema } from '@nurturing/schemas'
import { apiFetch } from '../lib/api'

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
  const [requestError, setRequestError] = useState<string | null>(null)

  const fetchLogs = () =>
    apiFetch('/api/workouts')
      .then((r) => {
        if (!r.ok) throw new Error('Failed to load workout logs')
        return r.json()
      })
      .then(setLogs)
      .catch(() => setRequestError('Could not load workout logs. Check API connection.'))

  useEffect(() => { fetchLogs() }, [])

  const totalMinutes = logs.reduce((sum, l) => sum + l.durationMinutes, 0)

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
    setErrors((err) => ({ ...err, [e.target.name]: '' }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setRequestError(null)
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
    try {
      const res = await apiFetch('/api/workouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        setRequestError('Could not save workout. Please try again.')
        return
      }

      setForm(emptyForm)
      setErrors({})
      await fetchLogs()
    } catch {
      setRequestError('Network issue while saving workout. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id: string) {
    setRequestError(null)
    try {
      const res = await apiFetch(`/api/workouts/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        setRequestError('Could not delete workout. Please try again.')
        return
      }
      setLogs((l) => l.filter((x) => x.id !== id))
    } catch {
      setRequestError('Network issue while deleting workout. Please try again.')
    }
  }

  const intensityColor = { low: 'bg-green-100 text-green-700', moderate: 'bg-yellow-100 text-yellow-700', high: 'bg-red-100 text-red-700' }

  return (
    <div className="space-y-6 page-enter">
      <div>
        <h1 className="text-4xl font-semibold">Workouts</h1>
        {logs.length > 0 && (
          <p className="text-[var(--muted)] text-sm mt-1">{totalMinutes} min logged</p>
        )}
        {requestError && <p className="text-sm text-red-600 mt-2">{requestError}</p>}
      </div>

      {/* Add workout form */}
      <form onSubmit={handleSubmit} className="panel p-5 space-y-4">
        <h2 className="text-xl font-medium">Log a workout</h2>

        <div className="grid sm:grid-cols-3 gap-3">
          <div className="sm:col-span-1">
            <label className="block text-xs font-medium text-[var(--muted)] mb-1">Workout type *</label>
            <input
              name="type" value={form.type} onChange={handleChange}
              placeholder="e.g. Running, Yoga"
              className="field"
            />
            {errors.type && <p className="text-xs text-red-500 mt-1">{errors.type}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--muted)] mb-1">Duration (min) *</label>
            <input
              name="durationMinutes" value={form.durationMinutes} onChange={handleChange}
              type="number" min="1" placeholder="30"
              className="field"
            />
            {errors.durationMinutes && <p className="text-xs text-red-500 mt-1">{errors.durationMinutes}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--muted)] mb-1">Intensity *</label>
            <select
              name="intensityLevel" value={form.intensityLevel} onChange={handleChange}
              className="field"
            >
              {intensityLevels.map((i) => <option key={i} value={i}>{i}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-[var(--muted)] mb-1">Notes</label>
          <textarea
            name="notes" value={form.notes} onChange={handleChange}
            placeholder="How did it feel?"
            rows={2}
            className="field resize-none"
          />
        </div>

        <button
          type="submit" disabled={submitting}
          className="primary-btn w-full sm:w-auto"
        >
          {submitting ? 'Saving…' : 'Log workout'}
        </button>
      </form>

      {/* Log list */}
      {logs.length === 0 ? (
        <p className="text-[var(--muted)] text-sm text-center py-8">No workouts logged yet.</p>
      ) : (
        <div className="space-y-2">
          {logs.map((log) => (
            <div key={log.id} className="panel flex items-center justify-between rounded-xl px-4 py-3">
              <div>
                <p className="font-medium text-[var(--ink)] text-sm">{log.type}</p>
                <p className="text-xs text-[var(--muted)]">
                  {log.durationMinutes} min ·{' '}
                  <span className={`inline-block px-1.5 py-0.5 rounded text-xs font-medium ${intensityColor[log.intensityLevel]}`}>
                    {log.intensityLevel}
                  </span>
                  {log.notes && ` · ${log.notes}`}
                </p>
              </div>
              <button onClick={() => handleDelete(log.id)} className="text-[#b08f76] hover:text-[#8f2f1e] transition-colors text-lg leading-none">×</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
