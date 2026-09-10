import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

/**
 * Where the application looks for the API, checked in the source rather than at runtime.
 *
 * This is the test that was missing when the first deploy failed. The fallback was
 * `http://localhost:8081/api/v1`, correct on the machine that wrote it and wrong
 * everywhere else: in a visitor's browser `localhost` is their own computer, so every call
 * from the deployed site went to a machine with no backend and the screen said "no
 * connection to the server". Every rehearsal ran where `localhost:8081` happened to exist.
 *
 * Reading the file is deliberate. Importing the module would prove nothing, because the
 * `.env` in this repository sets VITE_API_URL and the fallback is never reached in a test
 * run; asserting on `api.defaults.baseURL` passes whatever the fallback says. What has to
 * be true is that the fallback compiled into an image built without an env file is a path,
 * and that is a fact about this line of source.
 */
describe('the API base URL fallback', () => {
  // Resolved from Vite's own root rather than from the working directory, so the test
  // passes whether it is run from this package or from the repository root. Under jsdom
  // `import.meta.url` is an http URL, not a file one, so it cannot be used here.
  const source = readFileSync(resolve(import.meta.dirname ?? process.cwd(), 'client.ts'), 'utf8')
  const fallback = /import\.meta\.env\.VITE_API_URL \?\? '([^']+)'/.exec(source)?.[1]

  it('is declared', () => {
    expect(fallback).toBeDefined()
  })

  it('is a relative path, so the browser resolves it against the site it is on', () => {
    expect(fallback).toBe('/api/v1')
  })

  it('never names a host, which would be a machine other than the one serving the page', () => {
    expect(fallback).not.toMatch(/^https?:\/\//)
    expect(fallback).not.toContain('localhost')
  })
})
