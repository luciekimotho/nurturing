import { useEffect, useState } from 'react'
import type { FoodLog } from '@nurturing/core'
import { FoodLogSchema } from '@nurturing/schemas'

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:4000'

const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack'] as const

const emptyForm = {
  name: '',
  calories: '',
  protein: '',
  carbs: '',
  fat: '',
  mealType: 'breakfast' as typeof mealTypes[number],
}

export default function FoodLog() {
  const [logs, setLogs] = useState<FoodLog[]>([])
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  const fetchLogs = () =>
    fetch(`${API}/api/food`).then((r) => r.json()).then(setLogs)

  useEffect(() => { fetchLogs() }, [])

  const totalCalories = logs.reduce((sum, l) => sum + l.calories, 0)

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
    setErrors((err) => ({ ...err, [e.target.name]: '' }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const payload = {
      name: form.name,
      calories: Number(form.calories),
      protein: form.protein ? Number(form.protein) : undefined,
      carbs: form.carbs ? Number(form.carbs) : undefined,
      fat: form.fat ? Number(form.fat) : undefined,
      mealType: form.mealType,
      loggedAt: new Date().toISOString(),
    }
    const result = FoodLogSchema.safeParse(payload)
    if (!result.success) {
      const flat = result.error.flatten().fieldErrors
      setErrors(Object.fromEntries(Object.entries(flat).map(([k, v]) => [k, v?.[0] ?? ''])))
      return
    }
    setSubmitting(true)
    await fetch(`${API}/api/food`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    setForm(emptyForm)
    await fetchLogs()
    setSubmitting(false)
  }

  async function handleDelete(id: string) {
    await fetch(`${API}/api/food/${id}`, { method: 'DELETE' })
    setLogs((l) => l.filter((x) => x.id !== id))
  }

  return (
    <div className="space-y-6 page-enter">
      <div>
        <h1 className="text-4xl font-semibold">Food Log</h1>
        {logs.length > 0 && (
          <p className="text-[var(--muted)] text-sm mt-1">
            {totalCalories} kcal logged today
          </p>
        )}
      </div>

      {/* Add food form */}
      <form onSubmit={handleSubmit} className="panel p-5 space-y-4">
        <h2 className="text-xl font-medium">Add a meal</h2>

        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-[var(--muted)] mb-1">Food name *</label>
            <input
              name="name" value={form.name} onChange={handleChange}
              placeholder="e.g. Ugali with sukuma wiki"
              className="field"
            />
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

        <button
          type="submit" disabled={submitting}
          className="primary-btn w-full sm:w-auto"
        >
          {submitting ? 'Saving…' : 'Add meal'}
        </button>
      </form>

      {/* Log list */}
      {logs.length === 0 ? (
        <p className="text-[var(--muted)] text-sm text-center py-8">No meals logged yet.</p>
      ) : (
        <div className="space-y-2">
          {logs.map((log) => (
            <div key={log.id} className="panel flex items-center justify-between rounded-xl px-4 py-3">
              <div>
                <p className="font-medium text-[var(--ink)] text-sm">{log.name}</p>
                <p className="text-xs text-[var(--muted)] capitalize">{log.mealType} · {log.calories} kcal
                  {log.protein != null && ` · P: ${log.protein}g`}
                  {log.carbs != null && ` · C: ${log.carbs}g`}
                  {log.fat != null && ` · F: ${log.fat}g`}
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
