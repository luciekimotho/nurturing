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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-stone-800">Food Log</h1>
        {logs.length > 0 && (
          <p className="text-stone-500 text-sm mt-1">
            {totalCalories} kcal logged today
          </p>
        )}
      </div>

      {/* Add food form */}
      <form onSubmit={handleSubmit} className="bg-white border border-stone-200 rounded-2xl p-5 space-y-4">
        <h2 className="font-medium text-stone-700">Add a meal</h2>

        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-stone-600 mb-1">Food name *</label>
            <input
              name="name" value={form.name} onChange={handleChange}
              placeholder="e.g. Ugali with sukuma wiki"
              className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
            />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-600 mb-1">Meal type *</label>
            <select
              name="mealType" value={form.mealType} onChange={handleChange}
              className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
            >
              {mealTypes.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {(['calories', 'protein', 'carbs', 'fat'] as const).map((field) => (
            <div key={field}>
              <label className="block text-xs font-medium text-stone-600 mb-1 capitalize">
                {field} {field === 'calories' ? '(kcal) *' : '(g)'}
              </label>
              <input
                name={field} value={form[field]} onChange={handleChange} type="number" min="0"
                placeholder="0"
                className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300"
              />
              {errors[field] && <p className="text-xs text-red-500 mt-1">{errors[field]}</p>}
            </div>
          ))}
        </div>

        <button
          type="submit" disabled={submitting}
          className="w-full sm:w-auto px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
        >
          {submitting ? 'Saving…' : 'Add meal'}
        </button>
      </form>

      {/* Log list */}
      {logs.length === 0 ? (
        <p className="text-stone-400 text-sm text-center py-8">No meals logged yet.</p>
      ) : (
        <div className="space-y-2">
          {logs.map((log) => (
            <div key={log.id} className="flex items-center justify-between bg-white border border-stone-200 rounded-xl px-4 py-3">
              <div>
                <p className="font-medium text-stone-800 text-sm">{log.name}</p>
                <p className="text-xs text-stone-400 capitalize">{log.mealType} · {log.calories} kcal
                  {log.protein != null && ` · P: ${log.protein}g`}
                  {log.carbs != null && ` · C: ${log.carbs}g`}
                  {log.fat != null && ` · F: ${log.fat}g`}
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
