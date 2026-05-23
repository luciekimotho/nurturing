import type { CycleLog, CyclePhase } from '@nurturing/core'
import { getCurrentPhase } from '@nurturing/core'

function startOfDay(date: Date): Date {
  const normalized = new Date(date)
  normalized.setHours(0, 0, 0, 0)
  return normalized
}

export function toDateOnlyValue(date: Date): string {
  return startOfDay(date).toISOString().slice(0, 10)
}

function ordinalSuffix(day: number): string {
  const remainder = day % 10
  const teen = day % 100

  if (teen >= 11 && teen <= 13) return 'th'
  if (remainder === 1) return 'st'
  if (remainder === 2) return 'nd'
  if (remainder === 3) return 'rd'
  return 'th'
}

export function formatReadableDate(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value)
  const day = date.getDate()
  const month = date.toLocaleDateString(undefined, { month: 'long' })
  const year = date.getFullYear()
  return `${day}${ordinalSuffix(day)} ${month}, ${year}`
}

export function getCyclePhaseForDate(date: Date, logs: CycleLog[]): CyclePhase | null {
  const target = startOfDay(date).getTime()

  const matching = logs
    .map((log) => ({
      log,
      start: startOfDay(new Date(log.periodStart)).getTime(),
      end: log.periodEnd ? startOfDay(new Date(log.periodEnd)).getTime() : null,
    }))
    .filter((entry) => entry.start <= target)
    .sort((a, b) => b.start - a.start)[0]

  if (!matching) return null

  if (matching.end != null && target <= matching.end) {
    return 'menstrual'
  }

  return getCurrentPhase(new Date(matching.log.periodStart), new Date(date), matching.log.cycleLength ?? undefined)
}

export function isPeriodDay(date: Date, logs: CycleLog[]): boolean {
  const target = startOfDay(date).getTime()

  return logs.some((log) => {
    const start = startOfDay(new Date(log.periodStart)).getTime()
    const end = log.periodEnd ? startOfDay(new Date(log.periodEnd)).getTime() : start
    return target >= start && target <= end
  })
}
