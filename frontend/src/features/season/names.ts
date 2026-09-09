/**
 * How a partner's name is shortened on the season screens.
 *
 * Its own module rather than beside the components, because a file that exports both a
 * component and a plain function stops hot reload from working: React cannot tell a changed
 * component from a changed helper, so it reloads the page instead of swapping the component.
 */

/** The first letter, for an avatar with no picture. */
export function initial(name: string): string {
  return (name ?? '').trim().charAt(0).toUpperCase() || '?'
}

/** Just the first name, so a scoreboard row does not wrap on someone's full name. */
export function firstName(name: string): string {
  return (name ?? '').trim().split(/\s+/)[0] || '—'
}
