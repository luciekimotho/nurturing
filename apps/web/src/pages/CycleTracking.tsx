import { useEffect, useMemo, useState } from 'react'
import type { CycleLog, CyclePhase, Symptom } from '@nurturing/core'
import { CycleLogSchema, SymptomSchema } from '@nurturing/schemas'
import { DayPicker, type DateRange } from 'react-day-picker'
import { apiFetch } from '../lib/api'
import PhaseRing from '../components/PhaseRing'
import { formatReadableDate, getCyclePhaseForDate, isPeriodDay, toDateOnlyValue } from '../lib/cycle'
import 'react-day-picker/style.css'

const commonSymptoms = ['Cramps', 'Bloating', 'Fatigue', 'Headache', 'Mood swings', 'Breast tenderness', 'Spotting', 'Back pain']

function getPhaseWindow(start: Date, end: Date, phase: CyclePhase) {
  const phaseStart = new Date(start)
  const phaseEnd = new Date(end)

  phaseStart.setHours(0, 0, 0, 0)
  phaseEnd.setHours(23, 59, 59, 999)

  switch (phase) {
    case 'menstrual':
      phaseStart.setDate(phaseStart.getDate())
      phaseEnd.setDate(phaseStart.getDate() + 4)
      break
    case 'follicular':
      phaseStart.setDate(phaseStart.getDate() + 5)
      phaseEnd.setDate(phaseStart.getDate() + 7)
      break
    case 'ovulatory':
      phaseStart.setDate(phaseStart.getDate() + 13)
      phaseEnd.setDate(phaseStart.getDate() + 2)
      break
    case 'luteal':
      phaseStart.setDate(phaseStart.getDate() + 16)
      break
  }

  if (phase !== 'luteal' && phaseEnd > end) {
    phaseEnd.setTime(end.getTime())
  }

  if (phase === 'luteal' && phaseStart > end) {
    phaseStart.setTime(end.getTime())
  }

  return { start: phaseStart, end: phaseEnd }
}

export default function CycleTracking() {
  const [cycleLogs, setCycleLogs] = useState<CycleLog[]>([])
  const [symptoms, setSymptoms] = useState<Symptom[]>([])
  const [activeCycleId, setActiveCycleId] = useState<string | null>(null)
  const [rangeSelection, setRangeSelection] = useState<DateRange | undefined>()
  const [isLoggingPeriod, setIsLoggingPeriod] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [symptomType, setSymptomType] = useState('')
  const [symptomSeverity, setSymptomSeverity] = useState<1 | 2 | 3 | 4 | 5>(3)
  const [symptomErrors, setSymptomErrors] = useState<Record<string, string>>({})
  const [showCustomSymptom, setShowCustomSymptom] = useState(false)
  const [symptomSavedMessage, setSymptomSavedMessage] = useState<string | null>(null)
  const [requestError, setRequestError] = useState<string | null>(null)
  const [submittingCycle, setSubmittingCycle] = useState(false)
  const [submittingSymptom, setSubmittingSymptom] = useState(false)
  const [visibleMonth, setVisibleMonth] = useState<Date>(new Date())

  const fetchAll = () => Promise.all([
    apiFetch('/api/cycle').then((r) => r.json()).then(setCycleLogs),
    apiFetch('/api/cycle/symptoms').then((r) => r.json()).then(setSymptoms),
  ])

  useEffect(() => { fetchAll() }, [])

  useEffect(() => {
    if (!symptomSavedMessage) return

    const timer = setTimeout(() => setSymptomSavedMessage(null), 2200)
    return () => clearTimeout(timer)
  }, [symptomSavedMessage])

  const selectedDatePhase = useMemo(() => getCyclePhaseForDate(selectedDate, cycleLogs), [selectedDate, cycleLogs])

  const hasCompleteRange = Boolean(rangeSelection?.from && rangeSelection?.to)
  const activeCycle = useMemo(
    () => cycleLogs.find((log) => log.id === activeCycleId) ?? null,
    [cycleLogs, activeCycleId]
  )
  const activeMonthName = useMemo(
    () => visibleMonth.toLocaleDateString(undefined, { month: 'long' }),
    [visibleMonth]
  )
  const monthCycles = useMemo(() => {
    const monthStart = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1)
    const monthEnd = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 0, 23, 59, 59, 999)

    return cycleLogs.filter((log) => {
      const start = new Date(log.periodStart)
      const end = log.periodEnd ? new Date(log.periodEnd) : start
      return start <= monthEnd && end >= monthStart
    })
  }, [cycleLogs, visibleMonth])
  const sortedCycleLogsAsc = useMemo(
    () => [...cycleLogs].sort((a, b) => new Date(a.periodStart).getTime() - new Date(b.periodStart).getTime()),
    [cycleLogs]
  )
  const selectedCycleWindow = useMemo(() => {
    if (sortedCycleLogsAsc.length === 0) return null

    const selectedTime = selectedDate.getTime()
    let currentIndex = -1

    for (let idx = 0; idx < sortedCycleLogsAsc.length; idx += 1) {
      const start = new Date(sortedCycleLogsAsc[idx].periodStart).getTime()
      if (start <= selectedTime) {
        currentIndex = idx
      } else {
        break
      }
    }

    if (currentIndex === -1) return null

    const currentCycle = sortedCycleLogsAsc[currentIndex]
    const cycleStart = new Date(currentCycle.periodStart)
    const nextCycle = sortedCycleLogsAsc[currentIndex + 1]

    let cycleEnd: Date
    if (nextCycle) {
      cycleEnd = new Date(new Date(nextCycle.periodStart).getTime() - 1)
    } else if (currentCycle.cycleLength) {
      cycleEnd = new Date(cycleStart)
      cycleEnd.setDate(cycleEnd.getDate() + currentCycle.cycleLength - 1)
    } else if (currentCycle.periodEnd) {
      cycleEnd = new Date(currentCycle.periodEnd)
    } else {
      cycleEnd = new Date()
    }

    return {
      cycle: currentCycle,
      start: cycleStart,
      end: cycleEnd,
    }
  }, [selectedDate, sortedCycleLogsAsc])
  const selectedPhaseWindow = useMemo(() => {
    if (!selectedCycleWindow || !selectedDatePhase) return null

    return getPhaseWindow(selectedCycleWindow.start, selectedCycleWindow.end, selectedDatePhase)
  }, [selectedCycleWindow, selectedDatePhase])
  const symptomsInSelectedPhase = useMemo(() => {
    if (!selectedPhaseWindow) return []

    const startTime = selectedPhaseWindow.start.getTime()
    const endTime = selectedPhaseWindow.end.getTime()

    return symptoms
      .filter((s) => {
        const symptomTime = new Date(s.date).getTime()
        return symptomTime >= startTime && symptomTime <= endTime
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [symptoms, selectedPhaseWindow])

  async function removeSymptom(id: string) {
    try {
      const res = await apiFetch(`/api/cycle/symptoms/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        setRequestError('Could not remove symptom. Please try again.')
        return
      }
      await fetchAll()
    } catch {
      setRequestError('Network issue while removing symptom.')
    }
  }

  async function savePeriodRange(range: DateRange) {
    setRequestError(null)
    if (!range.from || !range.to) return

    const payload = {
      periodStart: range.from.toISOString(),
      periodEnd: range.to.toISOString(),
    }

    const result = CycleLogSchema.safeParse(payload)
    if (!result.success) {
      setRequestError('Invalid period range. Please try selecting the dates again.')
      return
    }

    setSubmittingCycle(true)
    try {
      const isEditing = Boolean(activeCycleId)
      const targetPath = isEditing ? `/api/cycle/${activeCycleId}` : '/api/cycle'
      const res = await apiFetch(targetPath, {
        method: isEditing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        setRequestError('Could not save cycle entry. Please try again.')
        return
      }

      setRangeSelection(undefined)
      setIsLoggingPeriod(false)
      setActiveCycleId(null)
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
    setSymptomSavedMessage(null)

    const selectedDateForLog = new Date(selectedDate)
    selectedDateForLog.setHours(12, 0, 0, 0)

    const payload = {
      date: selectedDateForLog.toISOString(),
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
      const res = await apiFetch('/api/cycle/symptoms', {
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
      setShowCustomSymptom(false)
      setSymptomErrors({})
      setSymptomSavedMessage('Saved symptom')
      await fetchAll()
    } catch {
      setRequestError('Network issue while saving symptom entry. Please try again.')
    } finally {
      setSubmittingSymptom(false)
    }
  }

  function handleDayTap(day: Date) {
    setSelectedDate(day)

    if (!isLoggingPeriod) {
      return
    }

    setRangeSelection((prev) => {
      if (!prev?.from || prev.to) {
        return { from: day, to: undefined }
      }

      if (day.getTime() < prev.from.getTime()) {
        return { from: day, to: prev.from }
      }

      return { from: prev.from, to: day }
    })
  }

  function beginEditCycle(log: CycleLog) {
    const from = new Date(log.periodStart)
    const to = log.periodEnd ? new Date(log.periodEnd) : new Date(log.periodStart)
    setActiveCycleId(log.id)
    setRangeSelection({ from, to })
    setSelectedDate(from)
    setIsLoggingPeriod(true)
    setRequestError(null)
  }

  async function removeCycle(log: CycleLog) {
    if (!confirm('Remove this cycle log?')) return

    setRequestError(null)

    try {
      const res = await apiFetch(`/api/cycle/${log.id}`, { method: 'DELETE' })

      if (!res.ok) {
        setRequestError('Could not remove cycle log. Please try again.')
        return
      }

      if (activeCycleId === log.id) {
        setActiveCycleId(null)
        setRangeSelection(undefined)
        setIsLoggingPeriod(false)
      }

      await fetchAll()
    } catch {
      setRequestError('Network issue while removing cycle log. Please try again.')
    }
  }

  async function handleSavePeriod() {
    if (!rangeSelection?.from || !rangeSelection?.to) {
      setRequestError('Pick both a period start and end date before saving.')
      return
    }

    await savePeriodRange(rangeSelection)
  }

  return (
    <div className="space-y-6 page-enter">
      <div>
        <h1 className="text-4xl font-semibold">Cycle Tracking</h1>
        {requestError && <p className="text-sm text-red-600 mt-2">{requestError}</p>}
      </div>

      <div className="grid md:grid-cols-[1fr_1.2fr] gap-4 items-start">
        <section className="panel p-5 space-y-4 bg-[linear-gradient(160deg,#fffaf2_0%,#f4e6d8_100%)]">
          <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-start">
            <div className="rounded-2xl border border-[var(--line)] bg-white/70 p-3 nurturing-datepicker">
              <DayPicker
                mode="single"
                selected={selectedDate}
                onDayClick={handleDayTap}
                month={visibleMonth}
                onMonthChange={setVisibleMonth}
                numberOfMonths={1}
                captionLayout="label"
                showOutsideDays
                disabled={{ after: new Date() }}
                modifiers={{
                  loggedPeriod: (day) => isPeriodDay(day, cycleLogs),
                  draftRangeStart: (day) => Boolean(rangeSelection?.from && toDateOnlyValue(day) === toDateOnlyValue(rangeSelection.from)),
                  draftRangeEnd: (day) => Boolean(rangeSelection?.to && toDateOnlyValue(day) === toDateOnlyValue(rangeSelection.to)),
                  draftRangeMiddle: (day) => {
                    if (!rangeSelection?.from || !rangeSelection?.to) return false
                    const value = day.getTime()
                    return value > rangeSelection.from.getTime() && value < rangeSelection.to.getTime()
                  },
                }}
                modifiersClassNames={{
                  loggedPeriod: 'period-logged-day',
                  draftRangeStart: 'period-range-start',
                  draftRangeEnd: 'period-range-end',
                  draftRangeMiddle: 'period-range-middle',
                }}
              />
            </div>

            <div className="flex flex-col gap-2 md:min-w-[170px]">
              <button
                type="button"
                onClick={() => {
                  setRequestError(null)
                  setRangeSelection(undefined)
                  setActiveCycleId(null)
                  setIsLoggingPeriod((v) => !v)
                }}
                className="primary-btn"
              >
                {isLoggingPeriod ? 'Cancel logging' : 'Start logging period'}
              </button>
              <button
                type="button"
                onClick={handleSavePeriod}
                disabled={!hasCompleteRange || submittingCycle}
                className="primary-btn"
              >
                {submittingCycle ? 'Saving…' : activeCycleId ? 'Update period' : 'Save period'}
              </button>

              {isLoggingPeriod && (
                <p className="text-xs text-[var(--muted)]">Tap start date, then end date.</p>
              )}

              {activeCycle && (
                <p className="text-xs text-[var(--muted)]">
                  Editing: {formatReadableDate(activeCycle.periodStart)}
                  {activeCycle.periodEnd ? ` -> ${formatReadableDate(activeCycle.periodEnd)}` : ''}
                </p>
              )}

              {submittingCycle && <p className="text-xs text-[var(--muted)]">Saving selected period…</p>}
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--line)] bg-white/65 p-3 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold">Quick symptom log</h2>
              <p className="text-xs text-[var(--muted)]">{formatReadableDate(selectedDate)}</p>
            </div>

            <form onSubmit={handleSymptomSubmit} className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {commonSymptoms.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                      setSymptomType(s)
                      setSymptomSavedMessage(null)
                      if (symptomErrors.type) {
                        setSymptomErrors((prev) => ({ ...prev, type: '' }))
                      }
                    }}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                      symptomType === s
                        ? 'bg-[var(--brand-soft)] border-[#cd8f70] text-[var(--brand-strong)]'
                        : 'border-[var(--line)] text-[var(--muted)] hover:border-[#cd8f70] hover:text-[var(--brand-strong)]'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--muted)] mb-1">Intensity</label>
                <div className="flex gap-2 mt-1">
                  {([1, 2, 3, 4, 5] as const).map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => {
                        setSymptomSeverity(n)
                        setSymptomSavedMessage(null)
                      }}
                      className={`w-9 h-9 rounded-full text-sm font-medium border transition-colors ${
                        symptomSeverity === n
                          ? 'bg-[var(--brand-strong)] border-[var(--brand-strong)] text-white'
                          : 'border-[var(--line)] text-[var(--muted)] hover:border-[#cd8f70]'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="submit"
                  disabled={submittingSymptom}
                  className="primary-btn"
                >
                  {submittingSymptom ? 'Saving…' : 'Save symptom'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCustomSymptom((v) => !v)}
                  className="text-xs font-semibold rounded-full border border-[var(--line)] px-2.5 py-1 text-[var(--muted)] hover:text-[var(--ink)]"
                >
                  {showCustomSymptom ? 'Hide custom' : 'Add custom symptom'}
                </button>
                {symptomSavedMessage && <p className="text-xs font-medium text-[#2f6f55]">{symptomSavedMessage}</p>}
              </div>

              {showCustomSymptom && (
                <div>
                  <label className="block text-xs font-medium text-[var(--muted)] mb-1">Custom symptom</label>
                  <input
                    value={symptomType}
                    onChange={(e) => {
                      setSymptomType(e.target.value)
                      setSymptomSavedMessage(null)
                    }}
                    placeholder="Type symptom"
                    className="field"
                  />
                </div>
              )}

              {symptomErrors.type && <p className="text-xs text-red-500">{symptomErrors.type}</p>}
            </form>
          </div>

        </section>

        <section
          className="panel p-5 h-fit"
          style={{ background: 'linear-gradient(160deg, #fffaf3 0%, #f4e8db 100%)' }}
        >
          <h2 className="text-xl font-medium">Current phase</h2>
          <div className="mt-3 flex justify-center">
            <div className="phase-ring flex items-center justify-center">
              <PhaseRing
                topText={formatReadableDate(selectedDate)}
                phase={selectedDatePhase}
                topTextClassName="text-sm uppercase tracking-[0.18em] text-[var(--muted)] leading-none"
              />
            </div>
          </div>

          {symptomsInSelectedPhase.length > 0 && (
            <div className="mt-4 border-t border-[var(--line)] pt-3 space-y-2">
              <p className="text-xs uppercase tracking-[0.15em] text-[var(--muted)]">Symptoms in this phase</p>
              <div className="flex flex-wrap gap-1.5">
                {symptomsInSelectedPhase.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center gap-1.5 rounded-full border border-[var(--line)] bg-white/70 px-2.5 py-1 text-xs font-medium text-[var(--ink)] shadow-sm"
                  >
                    <span>{s.type}</span>
                    <div className="flex gap-[2px]">
                      {([1, 2, 3, 4, 5] as const).map((n) => (
                        <span
                          key={n}
                          className={`w-[5px] h-[5px] rounded-full bg-current ${n <= s.severity ? 'opacity-70' : 'opacity-15'}`}
                        />
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeSymptom(s.id)}
                      aria-label={`Remove ${s.type}`}
                      className="ml-0.5 opacity-40 hover:opacity-100 font-bold text-sm leading-none"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {monthCycles.length > 0 && (
            <div className="mt-4 space-y-2 border-t border-[var(--line)] pt-4">
              <p className="text-xs uppercase tracking-[0.15em] text-[var(--muted)]">Manage {activeMonthName} Cycle</p>
              <div className="space-y-2">
                {monthCycles.map((log) => (
                  <div key={log.id} className="rounded-xl border border-[var(--line)] bg-white/70 px-3 py-2">
                    <p className="text-xs text-[var(--ink)] font-medium">
                      {formatReadableDate(log.periodStart)}
                      {log.periodEnd ? ` -> ${formatReadableDate(log.periodEnd)}` : ''}
                    </p>
                    <div className="mt-2 flex gap-2">
                      <button
                        type="button"
                        onClick={() => beginEditCycle(log)}
                        className="text-xs font-semibold rounded-full border border-[var(--line)] px-2.5 py-1 text-[var(--muted)] hover:text-[var(--ink)]"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => removeCycle(log)}
                        className="text-xs font-semibold rounded-full border border-[#ddb6a3] px-2.5 py-1 text-[#8b3f28] hover:bg-[#f7e1d7]"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>

      <p className="text-xs text-[var(--muted)] italic">
        This app provides general wellness information only, not medical advice.
      </p>
    </div>
  )
}
