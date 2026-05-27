import { useMemo, useState } from 'react'
import { DayPicker } from 'react-day-picker'
import { format, parse } from 'date-fns'
import 'react-day-picker/style.css'

interface DatePickerFieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  required?: boolean
}

function parseDateValue(value: string): Date | undefined {
  if (!value) return undefined
  const parsed = parse(value, 'yyyy-MM-dd', new Date())
  return Number.isNaN(parsed.getTime()) ? undefined : parsed
}

export default function DatePickerField({
  label,
  value,
  onChange,
  placeholder = 'Select a date',
  required = false,
}: DatePickerFieldProps) {
  const [open, setOpen] = useState(false)

  const selected = useMemo(() => parseDateValue(value), [value])

  return (
    <div className="relative">
      <label className="block text-xs font-medium text-[var(--muted)] mb-1">
        {label} {required ? '*' : ''}
      </label>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="field flex items-center justify-between bg-[var(--surface-warm)]"
      >
        <span className={value ? 'text-[var(--ink)]' : 'text-[var(--muted)]'}>
          {value ? format(parse(value, 'yyyy-MM-dd', new Date()), 'EEE, MMM d, yyyy') : placeholder}
        </span>
        <span aria-hidden="true" className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[var(--line)] bg-white text-[var(--muted)]">
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="5" width="18" height="16" rx="3" />
            <path d="M16 3v4M8 3v4M3 10h18" />
          </svg>
        </span>
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-2 panel rounded-2xl p-3 nurturing-datepicker w-[min(320px,calc(100vw-1rem))]">
          <div className="flex justify-center">
            <DayPicker
              mode="single"
              selected={selected}
              onSelect={(day) => {
                if (!day) return
                onChange(format(day, 'yyyy-MM-dd'))
                setOpen(false)
              }}
            />
          </div>
          <div className="mt-2 flex justify-between">
            <button
              type="button"
              onClick={() => {
                onChange('')
                setOpen(false)
              }}
              className="text-xs text-[var(--muted)] hover:text-[var(--brand)]"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-xs text-[var(--muted)] hover:text-[var(--brand)]"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
