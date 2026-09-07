import { useId, type InputHTMLAttributes, type ReactNode } from 'react'

interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  label: string
  /** Validation message for this field, already translated. */
  error?: string
  /** Rendered beside the label: a "forgot password" link, for instance. */
  action?: ReactNode
}

/**
 * A labelled input.
 *
 * The forms wrote `<label>` next to `<input>` with nothing tying them together, so the
 * label was decoration: a screen reader announced an unnamed edit box, clicking the text
 * did not focus the field, and a test could not find the input by its label either. The id
 * is generated rather than passed in, because two instances of the same form on one page
 * would otherwise share it.
 *
 * The error is linked through aria-describedby, so assistive technology reads the message
 * with the field instead of leaving it as loose text somewhere on the page.
 */
export function TextField({ label, error, action, ...input }: TextFieldProps) {
  const id = useId()
  const errorId = `${id}-error`

  return (
    <div>
      <div className={action ? 'mb-1 flex items-center justify-between' : undefined}>
        <label htmlFor={id} className={action ? 'label mb-0' : 'label'}>
          {label}
        </label>
        {action}
      </div>
      <input
        {...input}
        id={id}
        className="input"
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
      />
      {error && (
        <p id={errorId} role="alert" className="mt-1 text-xs font-semibold text-danger">
          {error}
        </p>
      )}
    </div>
  )
}
