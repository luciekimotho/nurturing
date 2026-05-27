import { useEffect, useState } from 'react'
import type { WorkoutLog } from '@nurturing/core'
import { WorkoutLogSchema } from '@nurturing/schemas'
import { apiFetch } from '../lib/api'
import DatePickerField from '../components/DatePickerField'

const intensityLevels = ['low', 'moderate', 'high'] as const
const workoutTypeOptions = [
  'Walk',
  'Jog',
  'Run',
  'Yoga',
  'Pilates',
  'Strength Training',
  'HIIT',
  'Cycling',
  'Spin Class',
  'Swimming',
  'Dance Workout',
  'Stretching',
  'Mobility',
  'Elliptical',
  'Stair Climber',
] as const

function toInputDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function createEmptyForm() {
  return {
    type: workoutTypeOptions[0],
    durationMinutes: '',
    intensityLevel: 'moderate' as typeof intensityLevels[number],
    notes: '',
    loggedAt: toInputDate(new Date()),
  }
}

export default function WorkoutLog() {
  const [logs, setLogs] = useState<WorkoutLog[]>([])
  const [form, setForm] = useState(createEmptyForm)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [savedMessage, setSavedMessage] = useState<string | null>(null)
  const [requestError, setRequestError] = useState<string | null>(null)
  const [selectedType, setSelectedType] = useState<string>('all')
  const [visibleMonth, setVisibleMonth] = useState<Date | null>(null)

  const fetchLogs = () =>
    apiFetch('/api/workouts')
      .then((r) => {
        if (!r.ok) throw new Error('Failed to load workout logs')
        return r.json()
      })
      .then(setLogs)
      .catch(() => setRequestError('Could not load workout logs. Check API connection.'))

  useEffect(() => { fetchLogs() }, [])

  useEffect(() => {
    if (visibleMonth || logs.length === 0) return

    const latest = new Date(logs[0].loggedAt)
    setVisibleMonth(new Date(latest.getFullYear(), latest.getMonth(), 1))
  }, [logs, visibleMonth])

  const monthFormatter = new Intl.DateTimeFormat('en-GB', {
    month: 'long',
    year: 'numeric',
  })

  const dateFormatter = new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })

  const workoutTypes = Array.from(new Set(logs.map((log) => log.type.trim()).filter(Boolean)))
  const activeMonth = visibleMonth ?? new Date(new Date().getFullYear(), new Date().getMonth(), 1)

  const typeFilteredLogs = selectedType === 'all'
    ? logs
    : logs.filter((log) => log.type.toLowerCase() === selectedType.toLowerCase())

  const visibleLogs = typeFilteredLogs.filter((log) => {
    const date = new Date(log.loggedAt)
    return date.getFullYear() === activeMonth.getFullYear() && date.getMonth() === activeMonth.getMonth()
  })

  function shiftMonth(offset: number) {
    setVisibleMonth((prev) => {
      const base = prev ?? new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      return new Date(base.getFullYear(), base.getMonth() + offset, 1)
    })
  }

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
      loggedAt: form.loggedAt ? new Date(`${form.loggedAt}T12:00:00`).toISOString() : new Date().toISOString(),
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

      setForm(createEmptyForm())
      setErrors({})
      setSavedMessage('Workout saved')
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

  const intensityLabel = { low: 'Low', moderate: 'Moderate', high: 'High' }

  return (
    <div className="space-y-6 page-enter">
      <div>
        <h1 className="text-4xl font-semibold">Workouts</h1>
        {requestError && <p className="text-sm text-red-600 mt-2">{requestError}</p>}
      </div>

      {/* Add workout form */}
      <form onSubmit={handleSubmit} className="panel p-4 sm:p-5 space-y-4">
        <h2 className="text-xl font-medium">Log a workout</h2>

        <div className="grid sm:grid-cols-4 gap-3">
          <div className="sm:col-span-1">
            <label className="block text-xs font-medium text-[var(--muted)] mb-1">Workout type *</label>
            <select
              name="type"
              value={form.type}
              onChange={handleChange}
              className="field"
            >
              {workoutTypeOptions.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
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

          <DatePickerField
            label="Date"
            value={form.loggedAt}
            onChange={(value) => setForm((f) => ({ ...f, loggedAt: value }))}
            placeholder="Today"
          />
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

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="submit" disabled={submitting}
            className="primary-btn w-full sm:w-auto"
          >
            {submitting ? 'Saving…' : 'Log workout'}
          </button>
          {savedMessage && <p className="text-xs font-medium text-[#2f6f55]">{savedMessage}</p>}
        </div>
      </form>

      {/* Log list */}
      {logs.length === 0 ? (
        <p className="text-[var(--muted)] text-sm text-center py-8">No workouts logged yet.</p>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setSelectedType('all')}
              className={`filter-pill ${selectedType === 'all' ? 'is-active' : ''}`}
            >
              All
            </button>
            {workoutTypes.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setSelectedType(type)}
                className={`filter-pill ${selectedType.toLowerCase() === type.toLowerCase() ? 'is-active' : ''}`}
              >
                {type}
              </button>
            ))}
          </div>

          <section className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => shiftMonth(-1)}
                className="log-chip"
                aria-label="Previous month"
              >
                Prev
              </button>
              <h2 className="text-2xl font-semibold">{monthFormatter.format(activeMonth)}</h2>
              <button
                type="button"
                onClick={() => shiftMonth(1)}
                className="log-chip"
                aria-label="Next month"
              >
                Next
              </button>
            </div>

            {visibleLogs.length === 0 ? (
              <p className="text-[var(--muted)] text-sm">No workouts found for this month and filter.</p>
            ) : (
              <div className="log-list">
                {visibleLogs.map((log) => (
                  <div key={log.id} className="log-item">
                    <div className="log-item-head">
                      <p className="log-item-title">{log.type}</p>
                      <button onClick={() => handleDelete(log.id)} className="log-delete-btn" aria-label={`Delete ${log.type}`}>×</button>
                    </div>
                    <div className="log-item-chips">
                      <span className="log-chip is-highlight">{intensityLabel[log.intensityLevel]}</span>
                      <span className="log-chip">{log.durationMinutes} min</span>
                      {log.notes && <span className="log-chip">{log.notes}</span>}
                      <span className="log-chip">{dateFormatter.format(new Date(log.loggedAt))}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  )
}
