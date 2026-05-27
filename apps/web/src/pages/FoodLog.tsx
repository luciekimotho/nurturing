import { useEffect, useState } from 'react'
import type { FoodLog } from '@nurturing/core'
import { FoodLogSchema } from '@nurturing/schemas'
import { apiFetch } from '../lib/api'
import DatePickerField from '../components/DatePickerField'

const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack'] as const

function toInputDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function createEmptyForm() {
  return {
    name: '',
    calories: '',
    protein: '',
    carbs: '',
    fat: '',
    mealType: 'breakfast' as typeof mealTypes[number],
    loggedAt: toInputDate(new Date()),
  }
}

type FoodSuggestion = {
  label: string
  popularityScore: number
  mealType: string | null
}

export default function FoodLog() {
  const [logs, setLogs] = useState<FoodLog[]>([])
  const [form, setForm] = useState(createEmptyForm)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [savedMessage, setSavedMessage] = useState<string | null>(null)
  const [requestError, setRequestError] = useState<string | null>(null)
  const [suggestions, setSuggestions] = useState<FoodSuggestion[]>([])
  const [suggestionsLoading, setSuggestionsLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedMealType, setSelectedMealType] = useState<string>('all')
  const [visibleMonth, setVisibleMonth] = useState<Date | null>(null)

  const fetchLogs = () =>
    apiFetch('/api/food')
      .then((r) => {
        if (!r.ok) throw new Error('Failed to load food logs')
        return r.json()
      })
      .then(setLogs)
      .catch(() => setRequestError('Could not load food logs. Check API connection.'))

  useEffect(() => { fetchLogs() }, [])

  useEffect(() => {
    if (visibleMonth || logs.length === 0) return

    const latest = new Date(logs[0].loggedAt)
    setVisibleMonth(new Date(latest.getFullYear(), latest.getMonth(), 1))
  }, [logs, visibleMonth])

  useEffect(() => {
    const query = form.name.trim()

    if (query.length < 2) {
      setSuggestions([])
      setSuggestionsLoading(false)
      return
    }

    const controller = new AbortController()
    setSuggestionsLoading(true)

    const timeoutId = window.setTimeout(() => {
      apiFetch(`/api/food/suggestions?q=${encodeURIComponent(query)}&limit=8`, {
        signal: controller.signal,
      })
        .then((r) => (r.ok ? r.json() : []))
        .then((data: FoodSuggestion[]) => setSuggestions(data))
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
  }, [form.name])

  const query = form.name.trim().toLowerCase()
  const fallbackSuggestions = Array.from(
    new Map(
      logs
        .filter((log) => log.name.toLowerCase().includes(query))
        .map((log) => [log.name.toLowerCase(), { label: log.name, popularityScore: 0, mealType: log.mealType }]),
    ).values(),
  ).slice(0, 8)

  const visibleSuggestions = suggestions.length > 0 ? suggestions : fallbackSuggestions

  function applySuggestion(suggestion: FoodSuggestion) {
    setForm((prev) => {
      const next = { ...prev, name: suggestion.label }

      if (suggestion.mealType && mealTypes.includes(suggestion.mealType as typeof mealTypes[number])) {
        next.mealType = suggestion.mealType as typeof mealTypes[number]
      }

      return next
    })
    setErrors((err) => ({ ...err, name: '' }))
    setShowSuggestions(false)
  }

  const dateFormatter = new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })

  const monthFormatter = new Intl.DateTimeFormat('en-GB', {
    month: 'long',
    year: 'numeric',
  })

  const mealTypesInLogs = Array.from(new Set(logs.map((log) => log.mealType.trim()).filter(Boolean)))
  const activeMonth = visibleMonth ?? new Date(new Date().getFullYear(), new Date().getMonth(), 1)

  const typeFilteredLogs = selectedMealType === 'all'
    ? logs
    : logs.filter((log) => log.mealType.toLowerCase() === selectedMealType.toLowerCase())

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

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm((f) => {
      const next = { ...f, [e.target.name]: e.target.value }

      if (e.target.name === 'name') {
        setShowSuggestions(true)
        const matchedSuggestion = suggestions.find(
          (suggestion) => suggestion.label.toLowerCase() === e.target.value.trim().toLowerCase(),
        )

        if (matchedSuggestion?.mealType && mealTypes.includes(matchedSuggestion.mealType as typeof mealTypes[number])) {
          next.mealType = matchedSuggestion.mealType as typeof mealTypes[number]
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
      name: form.name,
      calories: Number(form.calories),
      protein: form.protein ? Number(form.protein) : undefined,
      carbs: form.carbs ? Number(form.carbs) : undefined,
      fat: form.fat ? Number(form.fat) : undefined,
      mealType: form.mealType,
      loggedAt: form.loggedAt ? new Date(`${form.loggedAt}T12:00:00`).toISOString() : new Date().toISOString(),
    }
    const result = FoodLogSchema.safeParse(payload)
    if (!result.success) {
      const flat = result.error.flatten().fieldErrors
      setErrors(Object.fromEntries(Object.entries(flat).map(([k, v]) => [k, v?.[0] ?? ''])))
      return
    }
    setSubmitting(true)
    try {
      const res = await apiFetch('/api/food', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        setRequestError('Could not save meal. Please try again.')
        return
      }

      setForm(createEmptyForm())
      setErrors({})
      setSavedMessage('Meal saved')
      await fetchLogs()
    } catch {
      setRequestError('Network issue while saving meal. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id: string) {
    setRequestError(null)
    try {
      const res = await apiFetch(`/api/food/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        setRequestError('Could not delete meal. Please try again.')
        return
      }
      setLogs((l) => l.filter((x) => x.id !== id))
    } catch {
      setRequestError('Network issue while deleting meal. Please try again.')
    }
  }

  return (
    <div className="space-y-6 page-enter">
      <div>
        <h1 className="text-4xl font-semibold">Food Log</h1>
        {requestError && <p className="text-sm text-red-600 mt-2">{requestError}</p>}
      </div>

      {/* Add food form */}
      <form onSubmit={handleSubmit} className="panel p-4 sm:p-5 space-y-4">
        <h2 className="text-xl font-medium">Add a meal</h2>

        <div className="grid sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-[var(--muted)] mb-1">Food name *</label>
            <input
              name="name" value={form.name} onChange={handleChange}
              placeholder="e.g. Ugali with sukuma wiki"
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
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--muted)] mb-1">Meal type *</label>
            <select
              name="mealType" value={form.mealType} onChange={handleChange}
              className="field"
            >
              {mealTypes.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <DatePickerField
            label="Date"
            value={form.loggedAt}
            onChange={(value) => setForm((f) => ({ ...f, loggedAt: value }))}
            placeholder="Today"
          />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {(['calories', 'protein', 'carbs', 'fat'] as const).map((field) => (
            <div key={field}>
              <label className="block text-xs font-medium text-[var(--muted)] mb-1 capitalize">
                {field} {field === 'calories' ? '(kcal) *' : '(g)'}
              </label>
              <input
                name={field} value={form[field]} onChange={handleChange} type="number" min="0"
                placeholder="0"
                className="field"
              />
              {errors[field] && <p className="text-xs text-red-500 mt-1">{errors[field]}</p>}
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="submit" disabled={submitting}
            className="primary-btn w-full sm:w-auto"
          >
            {submitting ? 'Saving…' : 'Add meal'}
          </button>
          {savedMessage && <p className="text-xs font-medium text-[#2f6f55]">{savedMessage}</p>}
        </div>
      </form>

      {/* Log list */}
      {logs.length === 0 ? (
        <p className="text-[var(--muted)] text-sm text-center py-8">No meals logged yet.</p>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setSelectedMealType('all')}
              className={`filter-pill ${selectedMealType === 'all' ? 'is-active' : ''}`}
            >
              All
            </button>
            {mealTypesInLogs.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setSelectedMealType(type)}
                className={`filter-pill ${selectedMealType.toLowerCase() === type.toLowerCase() ? 'is-active' : ''}`}
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
              <p className="text-[var(--muted)] text-sm">No meals found for this month and filter.</p>
            ) : (
              <div className="log-list">
                {visibleLogs.map((log) => (
                  <div key={log.id} className="log-item">
                    <div className="log-item-head">
                      <p className="log-item-title">{log.name}</p>
                      <button onClick={() => handleDelete(log.id)} className="log-delete-btn" aria-label={`Delete ${log.name}`}>×</button>
                    </div>
                    <div className="log-item-chips">
                      <span className="log-chip is-highlight capitalize">{log.mealType}</span>
                      <span className="log-chip">{log.calories} kcal</span>
                      {log.protein != null && <span className="log-chip">P {log.protein}g</span>}
                      {log.carbs != null && <span className="log-chip">C {log.carbs}g</span>}
                      {log.fat != null && <span className="log-chip">F {log.fat}g</span>}
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
