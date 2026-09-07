interface FormErrorProps {
  /** Already translated. Nothing is rendered when absent. */
  message?: string | null
}

/**
 * The message for a failure that belongs to the whole form rather than one field: wrong
 * credentials, a server that is down.
 *
 * `role="alert"` makes a screen reader announce it when it appears; without that, someone
 * who cannot see the page submits a form, nothing seems to happen, and the reason sits
 * silently above the button.
 */
export function FormError({ message }: FormErrorProps) {
  if (!message) return null

  return (
    <p
      role="alert"
      className="rounded-xl bg-danger-soft px-3 py-2 text-sm font-semibold text-danger"
    >
      {message}
    </p>
  )
}
