import { useId, type ReactNode } from 'react'

interface NumberFieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  /** Rendered after the input: "kg", "kcal", "min". */
  unit?: ReactNode
  step?: string
  min?: number
}

/**
 * A labelled numeric input.
 *
 * The same component existed twice, copied between the activity and nutrition screens,
 * and in both copies the label was not attached to the input: a screen reader announced an
 * unnamed field, and clicking the text did not focus it. One accessible version replaces
 * both, so the next fix does not have to be made twice.
 *
 * `inputMode="decimal"` asks a phone for the numeric keyboard, which is the difference
 * between typing a weight in two taps and hunting for the number key.
 */
export function NumberField({
  label,
  value,
  onChange,
  placeholder = '0',
  unit,
  step = '0.1',
  min = 0,
}: NumberFieldProps) {
  const id = useId()

  return (
    <div>
      <label htmlFor={id} className="label">
        {label}
      </label>
      <div className={unit ? 'flex items-center gap-2' : undefined}>
        <input
          id={id}
          type="number"
          min={min}
          step={step}
          inputMode="decimal"
          placeholder={placeholder}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="input"
        />
        {unit && <span className="text-sm font-bold text-muted">{unit}</span>}
      </div>
    </div>
  )
}
