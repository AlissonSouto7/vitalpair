import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from 'react'

interface NumberFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id' | 'type'> {
  label: string
  /** Rendered after the input: "kg", "kcal", "min". */
  unit?: ReactNode
  /** Validation message for this field, already translated. */
  error?: string
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
 *
 * The ref is forwarded and every other prop is spread onto the input, so
 * `{...register('weightKg')}` works here exactly as it does on TextField. Without that the
 * numeric fields would each need a Controller, which is a lot of ceremony for an input that
 * reports a string like any other.
 */
export const NumberField = forwardRef<HTMLInputElement, NumberFieldProps>(function NumberField(
  { label, unit, error, step = '0.1', min = 0, placeholder = '0', ...input },
  ref,
) {
  const id = useId()
  const errorId = `${id}-error`

  return (
    <div>
      <label htmlFor={id} className="label">
        {label}
      </label>
      <div className={unit ? 'flex items-center gap-2' : undefined}>
        <input
          {...input}
          ref={ref}
          id={id}
          type="number"
          min={min}
          step={step}
          inputMode="decimal"
          placeholder={placeholder}
          className="input"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
        />
        {unit && <span className="text-sm font-bold text-muted">{unit}</span>}
      </div>
      {error && (
        <p id={errorId} role="alert" className="mt-1 text-xs font-semibold text-danger">
          {error}
        </p>
      )}
    </div>
  )
})
