/// <reference types="vite/client" />

/**
 * The environment variables this application reads.
 *
 * Without this declaration `import.meta.env.VITE_API_URL` is typed `any`, so a typo in the
 * name compiles, reaches the browser, and produces requests to `undefined/auth/login`.
 * Declaring them turns that into a build error.
 *
 * Both are optional on purpose: the application has a working default for the API URL, and
 * Google sign-in is hidden when its client id is absent rather than crashing.
 */
interface ImportMetaEnv {
  /** Where the API lives. Defaults to the local backend when unset; `/api/v1` in production. */
  readonly VITE_API_URL?: string
  /** Google's OAuth client id. The sign-in button is not rendered without it. */
  readonly VITE_GOOGLE_CLIENT_ID?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
