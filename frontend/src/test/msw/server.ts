import { setupServer } from 'msw/node'

/**
 * The fake backend every component test talks to.
 *
 * It starts with no handlers on purpose: each test registers exactly the responses it
 * needs with `server.use(...)`, so a request the test did not anticipate fails loudly
 * (see `onUnhandledRequest: 'error'` in setup.ts) instead of being answered by a default
 * left over from another test. A form that "passes" because a stale handler said 200 is
 * the vacuous test this guards against.
 */
export const server = setupServer()
