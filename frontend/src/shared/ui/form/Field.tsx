import { useId, type ReactNode } from 'react'

/**
 * A label attached to whatever control it wraps.
 *
 * Used where the control is not a plain input, a Select for instance, so the id has to be
 * handed to the child rather than set here. Without it the label was loose text: announced
 * as nothing by a screen reader, and not clickable to focus the control.
 */
export function Field({
  label,
  hint,
  children,
}: {
  label: string
  /** Explanatory text under the label, announced with the control. */
  hint?: string
  children: (props: { id: string; 'aria-describedby'?: string }) => ReactNode
}) {
  const id = useId()
  const hintId = `${id}-hint`

  return (
    <div>
      <label htmlFor={id} className="label">
        {label}
      </label>
      {hint && (
        <p id={hintId} className="mb-3 text-xs text-muted">
          {hint}
        </p>
      )}
      {children({ id, 'aria-describedby': hint ? hintId : undefined })}
    </div>
  )
}
