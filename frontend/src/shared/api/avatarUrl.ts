/**
 * Turns the opaque name a profile carries into a URL an `<img>` can load.
 *
 * The server stores a name, not a URL, so that where images live can change without every
 * stored value becoming wrong. That means the client is the one that knows the address, and it
 * belongs in one place rather than in each screen that shows a face.
 *
 * Returns null for a profile with no photo, so the caller falls back to the initial.
 */
export function avatarUrl(objectName: string | null | undefined): string | null {
  if (!objectName) return null
  // A name this application generated, and nothing else. The value came from the API, but it
  // went through the database on the way, so by the time it arrives it is input again: without
  // this, a value that somehow held a full URL would turn the avatar into a request to
  // somebody else's server, which is the tracking problem the backend just closed.
  if (!/^[0-9a-f]{32}\.jpg$/.test(objectName)) return null
  return `${import.meta.env.VITE_API_URL ?? '/api/v1'}/users/avatars/${objectName}`
}
