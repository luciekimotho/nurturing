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

type WorkoutSuggestion = {
  label: string
  popularityScore: number
  intensityHint: string | null
}

export default function WorkoutLog() {
  const [logs, setLogs] = useState<WorkoutLog[]>([])
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [savedMessage, setSavedMessage] = useState<string | null>(null)
  const [requestError, setRequestError] = useState<string | null>(null)
  const [suggestions, setSuggestions] = useState<WorkoutSuggestion[]>([])
  const [suggestionsLoading, setSuggestionsLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)

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
    const query = form.type.trim()

    if (query.length < 2) {
      setSuggestions([])
      setSuggestionsLoading(false)
      return
    }

    const controller = new AbortController()
    setSuggestionsLoading(true)

    const timeoutId = window.setTimeout(() => {
      apiFetch(`/api/workouts/suggestions?q=${encodeURIComponent(query)}&limit=8`, {
        signal: controller.signal,
      })
        .then((r) => (r.ok ? r.json() : []))
        .then((data: WorkoutSuggestion[]) => setSuggestions(data))
        .catch(() => {
          if (!controller.signal.aborted) {
            setSuggestions([])
          }
        })
        .finally(() => {
          if (!controller.signal.aborted) {
            setSuggestionsLoading(false)
          }
        })
    }, 200)

    return () => {
      controller.abort()
      window.clearTimeout(timeoutId)
    }
  }, [form.type])

  const query = form.type.trim().toLowerCase()
  const fallbackSuggestions = Array.from(
    new Map(
      logs
        .filter((log) => log.type.toLowerCase().includes(query))
        .map((log) => [log.type.toLowerCase(), { label: log.type, popularityScore: 0, intensityHint: log.intensityLevel }]),
    ).values(),
  ).slice(0, 8)

  const visibleSuggestions = suggestions.length > 0 ? suggestions : fallbackSuggestions

  function applySuggestion(suggestion: WorkoutSuggestion) {
    setForm((prev) => {
      const next = { ...prev, type: suggestion.label }

      if (suggestion.intensityHint && intensityLevels.includes(suggestion.intensityHint as typeof intensityLevels[number])) {
        next.intensityLevel = suggestion.intensityHint as typeof intensityLevels[number]
      }

      return next
    })
    setErrors((err) => ({ ...err, type: '' }))
    setShowSuggestions(false)
  }

  const totalMinutes = logs.reduce((sum, l) => sum + l.durationMinutes, 0)

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setForm((f) => {
      const next = { ...f, [e.target.name]: e.target.value }

      if (e.target.name === 'type') {
        setShowSuggestions(true)
        const matchedSuggestion = suggestions.find(
          (suggestion) => suggestion.label.toLowerCase() === e.target.value.trim().toLowerCase(),
        )

        if (matchedSuggestion?.intensityHint && intensityLevels.includes(matchedSuggestion.intensityHint as typeof intensityLevels[number])) {
          next.intensityLevel = matchedSuggestion.intensityHint as typeof intensityLevels[number]
        }
      }

      return next
    })
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
        {logs.length > 0 && (
          <p className="text-[var(--muted)] text-sm mt-1">{totalMinutes} min logged</p>
        )}
        {requestError && <p className="text-sm text-red-600 mt-2">{requestError}</p>}
      </div>

      {/* Add workout form */}
      <form onSubmit={handleSubmit} className="panel p-4 sm:p-5 space-y-4">
        <h2 className="text-xl font-medium">Log a workout</h2>

        <div className="grid sm:grid-cols-3 gap-3">
          <div className="sm:col-span-1">
            <label className="block text-xs font-medium text-[var(--muted)] mb-1">Workout type *</label>
            <input
              name="type" value={form.type} onChange={handleChange}
              placeholder="e.g. Running, Yoga"
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => window.setTimeout(() => setShowSuggestions(false), 120)}
              autoComplete="off"
              className="field"
            />
            {showSuggestions && query.length >= 2 && visibleSuggestions.length > 0 && (
              <div className="mt-2 border border-[var(--line)] rounded-xl bg-white/95 shadow-sm overflow-hidden">
                {visibleSuggestions.map((suggestion) => (
                  <button
                    key={suggestion.label}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault()
                      applySuggestion(suggestion)
                    }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-[#f5f2ea]"
                  >
                    {suggestion.label}
                  </button>
                ))}
              </div>
            )}
            {suggestionsLoading && <p className="text-xs text-[var(--muted)] mt-1">Loading suggestions…</p>}
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
        <div className="log-list">
          {logs.map((log) => (
            <div key={log.id} className="log-item">
              <div className="log-item-head">
                <p className="log-item-title">{log.type}</p>
                <button onClick={() => handleDelete(log.id)} className="log-delete-btn" aria-label={`Delete ${log.type}`}>×</button>
              </div>
              <div className="log-item-chips">
                <span className="log-chip is-highlight">{intensityLabel[log.intensityLevel]}</span>
                <span className="log-chip">{log.durationMinutes} min</span>
                {log.notes && <span className="log-chip">{log.notes}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
