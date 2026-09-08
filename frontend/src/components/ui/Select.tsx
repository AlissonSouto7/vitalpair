import { useEffect, useRef, useState } from 'react'

interface Option<T extends string> {
  value: T
  label: string
}

/**
 * A dropdown built from buttons rather than a native select, so it can be styled.
 *
 * That choice costs accessibility unless it is paid back explicitly: a plain button tells
 * assistive technology nothing about being a chooser, what is chosen, or whether the list
 * is open. The combobox role and the aria-* attributes below say all three. The id lets a
 * label point at it, which a native select would have got for free.
 */
export function Select<T extends string>({
  id,
  value,
  onChange,
  options,
  placeholder = 'Selecione',
  'aria-describedby': describedBy,
  'aria-invalid': invalid,
}: {
  id?: string
  value: T | ''
  onChange: (value: T) => void
  options: Option<T>[]
  placeholder?: string
  'aria-describedby'?: string
  /** Set by a form when this control failed validation, so assistive technology says so. */
  'aria-invalid'?: boolean
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onDocClick(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false)
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [])

  const selected = options.find((o) => o.value === value)

  return (
    <div ref={ref} className="relative">
      <button
        id={id}
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="input flex items-center justify-between gap-2 text-left"
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-describedby={describedBy}
        aria-invalid={invalid}
      >
        <span className={selected ? 'text-ink' : 'text-faint'}>
          {selected ? selected.label : placeholder}
        </span>
        <svg
          className={`h-4 w-4 shrink-0 text-muted transition-transform ${open ? 'rotate-180' : ''}`}
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute z-30 mt-1.5 max-h-60 w-full overflow-auto rounded-xl border border-hair bg-surface p-1 shadow-xl shadow-[0_14px_36px_rgba(70,45,20,0.18)]"
        >
          {options.map((o) => {
            const active = o.value === value
            return (
              <li key={o.value} role="option" aria-selected={active}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(o.value)
                    setOpen(false)
                  }}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition ${
                    active ? 'bg-brand-soft font-bold text-brand-ink' : 'text-ink hover:bg-track'
                  }`}
                >
                  {o.label}
                  {active && (
                    <svg
                      className="h-4 w-4 text-brand-ink"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.7 5.3a1 1 0 010 1.4l-7.5 7.5a1 1 0 01-1.4 0L3.3 9.7a1 1 0 011.4-1.4l3.1 3.1 6.8-6.8a1 1 0 011.4 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
