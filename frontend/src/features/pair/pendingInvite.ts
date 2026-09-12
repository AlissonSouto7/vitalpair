/**
 * An invite code held between registering and the first sign-in.
 *
 * Registration no longer returns a session, so a person who arrived through an invite
 * cannot join the pair on the spot: joining needs a token. The code waits here until they
 * come back through the activation link and sign in, at which point the sign-in screen
 * consumes it. sessionStorage rather than localStorage, because the code belongs to this
 * visit: a stale one left on the machine would drop somebody into a pair they never chose.
 */
export const PENDING_INVITE_KEY = 'vitalpair-pending-invite'

/** Reads and clears the pending code, so it is used at most once. */
export function takePendingInvite(): string | null {
  try {
    const code = sessionStorage.getItem(PENDING_INVITE_KEY)
    if (code) sessionStorage.removeItem(PENDING_INVITE_KEY)
    return code
  } catch {
    // A browser with site data blocked throws on access; there is simply no pending code.
    return null
  }
}
