import { AxiosError } from 'axios'

/** The error envelope every endpoint answers with. */
interface ApiErrorBody {
  success: false
  message?: string
  data?: {
    status?: number
    requestId?: string
    violations?: { field: string; message: string }[]
  }
}

/**
 * The backend's generic validation message. It says nothing a person can act on, so a
 * caller with a specific fallback shows that instead.
 */
const GENERIC_VALIDATION = 'Erro de validação'

function body(error: unknown): ApiErrorBody | null {
  if (error instanceof AxiosError && error.response?.data) {
    return error.response.data as ApiErrorBody
  }
  return null
}

/**
 * The message to show for a failed request.
 *
 * Four pages carried their own copy of this, each subtly different: one filtered the
 * generic validation message, three did not. A single helper means a change to how errors
 * are presented happens once, and no page silently keeps the old behaviour.
 *
 * @param fallback shown when the server sent nothing useful, already translated
 */
export function getApiErrorMessage(error: unknown, fallback: string): string {
  const message = body(error)?.message
  if (!message || message === GENERIC_VALIDATION) return fallback
  return message
}

/**
 * Per-field validation errors, keyed by field name.
 *
 * Lets a form put the message next to the input that caused it rather than in a banner at
 * the top, which is the difference between "something is wrong" and "this date is invalid".
 */
export function getFieldErrors(error: unknown): Record<string, string> {
  const violations = body(error)?.data?.violations ?? []
  return Object.fromEntries(violations.map((v) => [v.field, v.message]))
}

/**
 * The id of the failed request, when the server sent one.
 *
 * Shown on unexpected failures so a person reporting a problem can quote it and the log
 * line is found immediately, instead of being guessed at from a timestamp.
 */
export function getRequestId(error: unknown): string | null {
  return body(error)?.data?.requestId ?? null
}

/** HTTP status of the failed request, or null when the request never got a response. */
export function getStatus(error: unknown): number | null {
  return error instanceof AxiosError ? (error.response?.status ?? null) : null
}
