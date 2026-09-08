import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterAll, afterEach, beforeAll } from 'vitest'

import { server } from './msw/server'

// A request no test registered a handler for is a bug in the test, not something to
// answer with a 404 and move on from: the component would then render an error path the
// test never meant to exercise.
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))

// Unmount everything between tests. Without this, a component left mounted by one test
// keeps timers and listeners running and shows up in the next test's queries.
afterEach(() => {
  cleanup()
  server.resetHandlers()
})

afterAll(() => server.close())
