import { AxiosError, AxiosHeaders } from 'axios'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { notifyIfServerFailed } from './notifyServerFailure'

vi.mock('sonner', () => ({ toast: { error: vi.fn() } }))

const { toast } = await import('sonner')
const errorToast = vi.mocked(toast.error)

/** An axios error the way the interceptor receives one. */
function apiError(status: number, requestId?: string) {
  const error = new AxiosError('failed')
  error.response = {
    status,
    statusText: '',
    headers: new AxiosHeaders(),
    config: { headers: new AxiosHeaders() },
    data: { success: false, data: requestId ? { requestId } : {} },
  }
  return error
}

beforeEach(() => {
  errorToast.mockClear()
})

describe('notifyIfServerFailed', () => {
  it('shows the request id when the server fails', () => {
    notifyIfServerFailed(apiError(500, 'abc-123'))

    expect(errorToast).toHaveBeenCalledOnce()
    // The id is the whole point: without it a report of "it broke" leaves us matching a
    // rough timestamp against a log. Asserted on the id rather than the whole sentence,
    // because the sentence is translated and this test does not care which language ran.
    expect(errorToast.mock.calls[0][1]?.description).toContain('abc-123')
  })

  it('says nothing for a 4xx', () => {
    // The form that sent it puts the message next to the field; a toast on top would be
    // saying the same thing twice.
    notifyIfServerFailed(apiError(422, 'abc-123'))
    notifyIfServerFailed(apiError(404))

    expect(errorToast).not.toHaveBeenCalled()
  })

  it('says nothing for a 401, which the refresh handles', () => {
    notifyIfServerFailed(apiError(401))

    expect(errorToast).not.toHaveBeenCalled()
  })

  it('speaks up when the request never reached the server', () => {
    // No response at all: offline, DNS, or the server down. Worth saying out loud, because
    // otherwise the screen just sits there doing nothing.
    notifyIfServerFailed(new AxiosError('Network Error'))

    expect(errorToast).toHaveBeenCalledOnce()
  })

  it('does not stack the same failure twice', () => {
    // One broken screen can fire several requests at once, and four identical toasts is
    // noise, not information.
    notifyIfServerFailed(apiError(500, 'same-id'))
    notifyIfServerFailed(apiError(500, 'same-id'))

    expect(errorToast).toHaveBeenCalledOnce()
  })

  it('still reports a second, different failure', () => {
    notifyIfServerFailed(apiError(500, 'first-id'))
    notifyIfServerFailed(apiError(500, 'second-id'))

    expect(errorToast).toHaveBeenCalledTimes(2)
  })
})
