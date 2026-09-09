import { useId, type ReactNode } from 'react'

/**
 * A label attached to whatever control it wraps.
 *
 * Used where the control is not a plain input, a Select for instance, so the id has to be
 * handed to the child rather than set here. Without it the label was loose text: announced
 * as nothing by a screen reader, and not clickable to focus the control.
 *
 * The error is linked through aria-describedby, the same way TextField does it, so the
 * message is read with the control rather than found somewhere else on the page.
 */
export function Field({
  label,
  hint,
  error,
  labelsAGroup = false,
  children,
}: {
  label: string
  /** Explanatory text under the label, announced with the control. */
  hint?: string
  /** Validation message for this control, already translated. */
  error?: string
  /**
   * Set when the child is several controls behind `role="group"` rather than one control.
   *
   * A `<label htmlFor>` names a form control, and a group is not one, so pointing a label
   * at it leaves the group anonymous and a screen reader reads its contents unnamed. In
   * that case the text is rendered as a span and the child names itself with
   * `aria-labelledby`, which is the attribute that works on a group.
   */
  labelsAGroup?: boolean
  children: (props: {
    id: string
    labelId: string
    'aria-describedby'?: string
    'aria-invalid'?: true
  }) => ReactNode
}) {
  const id = useId()
  const labelId = `${id}-label`
  const hintId = `${id}-hint`
  const errorId = `${id}-error`
  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ')

  return (
    <div>
      {labelsAGroup ? (
        <span id={labelId} className="label block">
          {label}
        </span>
      ) : (
        <label id={labelId} htmlFor={id} className="label">
          {label}
        </label>
      )}
      {hint && (
        <p id={hintId} className="mb-3 text-xs text-muted">
          {hint}
        </p>
      )}
      {children({
        id,
        labelId,
        'aria-describedby': describedBy || undefined,
        'aria-invalid': error ? true : undefined,
      })}
      {error && (
        <p id={errorId} role="alert" className="mt-1 text-xs font-semibold text-danger">
          {error}
        </p>
      )}
    </div>
  )
}
