import { http, HttpResponse, type DefaultBodyType } from 'msw'

/**
 * Handler helpers that speak the backend's envelope.
 *
 * The base URL is `/api/v1`, resolved against whatever origin the page is on: jsdom's
 * `localhost:3000` here, the real domain in a browser. A leading `*` matches any origin,
 * so a test does not pass locally and fail on the server for a reason that has nothing to
 * do with the code under test.
 */
export const path = (route: string) => `*/api/v1${route}`

/** A successful envelope, the shape every endpoint answers with. */
export function ok<T>(data: T, status = 200) {
  return HttpResponse.json({ success: true, message: 'ok', data }, { status })
}

/** A failed envelope. `message` is what getApiErrorMessage would surface. */
export function fail(status: number, message: string) {
  return HttpResponse.json({ success: false, message, data: { status } }, { status })
}

/**
 * A handler that records every request body it receives.
 *
 * Tests assert on `calls` rather than on the screen alone: a validation message on screen
 * proves the message rendered, not that the request was withheld. The list proves the
 * second half.
 */
export function recording<T extends DefaultBodyType = DefaultBodyType>(
  method: 'post' | 'put' | 'patch' | 'delete',
  route: string,
  respond: (body: T) => Response = () => ok(null),
) {
  const calls: T[] = []
  const handler = http[method](path(route), async ({ request }) => {
    const text = await request.text()
    const body = (text ? JSON.parse(text) : null) as T
    calls.push(body)
    return respond(body)
  })
  return { handler, calls }
}
