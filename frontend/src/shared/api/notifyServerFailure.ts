import { toast } from 'sonner'

import { getRequestId, getStatus } from './errors'

import i18n from '@/i18n'

/**
 * The last request id shown, so one broken screen firing several requests does not stack
 * four identical toasts on top of each other.
 */
let lastShown: string | null = null

/**
 * Tells the person when the server itself failed, and gives them the request id.
 *
 * Only 5xx and a dead connection. A 400 or a 422 is the screen's own business: the form
 * that sent it puts the message next to the field, and a toast on top of that says the
 * same thing twice. A 401 is handled by the refresh above and, when that fails too, by
 * being sent to the login page, which is louder than any toast.
 *
 * The request id is the point. Without it a person reporting "it broke" leaves us matching
 * a rough timestamp against a log; with it the line is found immediately.
 */
export function notifyIfServerFailed(error: unknown): void {
  const status = getStatus(error)

  // A null status means the request never got a response: offline, DNS, or the server
  // down. Worth saying out loud, because otherwise the screen just sits there.
  const serverFailed = status === null || status >= 500
  if (!serverFailed) return

  const requestId = getRequestId(error)
  if (requestId !== null && requestId === lastShown) return
  lastShown = requestId

  const t = i18n.t.bind(i18n)
  toast.error(status === null ? t('errors.toast.offline') : t('errors.toast.serverError'), {
    description: requestId ? t('errors.toast.requestId', { id: requestId }) : undefined,
    // Long enough to read a uuid and copy it, since that is what it is for.
    duration: 8000,
  })
}
