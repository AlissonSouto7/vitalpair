import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// Unmount everything between tests. Without this, a component left mounted by one test
// keeps timers and listeners running and shows up in the next test's queries.
afterEach(() => {
  cleanup()
})
