import { useEffect, useRef, useState } from 'react'

interface Option<T extends string> {
  value: T
  label: string
}

export function Select<T extends string>({
  value,
  onChange,
  options,
  placeholder = 'Selecione',
}: {
  value: T | ''
  onChange: (value: T) => void
  options: Option<T>[]
  placeholder?: string
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
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="input flex items-center justify-between gap-2 text-left"
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
        <ul className="absolute z-30 mt-1.5 max-h-60 w-full overflow-auto rounded-xl border border-line bg-surface p-1 shadow-xl shadow-black/60">
          {options.map((o) => {
            const active = o.value === value
            return (
              <li key={o.value}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(o.value)
                    setOpen(false)
                  }}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition ${
                    active ? 'bg-lime-400/15 font-medium text-accent' : 'text-ink hover:bg-surface2'
                  }`}
                >
                  {o.label}
                  {active && <span className="text-accent">✓</span>}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
