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
        <span aria-hidden="true" className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[var(--line)] bg-white text-xs">Cal</span>
      </button>

      {open && (
        <div className="absolute z-20 mt-2 panel rounded-2xl p-3 nurturing-datepicker w-[300px] max-w-[92vw]">
          <DayPicker
            mode="single"
            selected={selected}
            onSelect={(day) => {
              if (!day) return
              onChange(format(day, 'yyyy-MM-dd'))
              setOpen(false)
            }}
          />
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
