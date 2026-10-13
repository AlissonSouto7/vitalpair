/**
 * How a person's name is shortened for the screen.
 *
 * These two lines existed in six and three copies respectively, one per screen, and the
 * copies had drifted apart in the only part that is a product decision: what to show when
 * there is no name. The dashboard and the feed fell back to `A`, which is left over from the
 * example data the redesign was built against ("Ana"); the season end screen used `P`, for
 * "Par". Both put a letter in an avatar that reads as somebody's initial, so a feed row whose
 * actor failed to load showed a confident `A` for a person who is not there.
 *
 * The fallback is `?` everywhere now. An avatar is a claim about who did something, and a
 * question mark is the only honest claim to make when the name has not arrived.
 *
 * It is reached by absence of data, not by a blank name: both forms that write a name use
 * `@NotBlank`, so the stored value always has a letter. What is missing here is a partner who
 * does not exist yet (`partnerName: string | null`), or a query that has not resolved
 * (`me?.name`).
 */

/** The first letter, upper case, for an avatar. `?` when there is no name to take it from. */
export function initial(name?: string | null): string {
  return (name ?? '').trim().charAt(0).toUpperCase() || '?'
}

/** Just the first name, so a scoreboard row does not wrap on someone's full name. */
export function firstName(name?: string | null): string {
  return (name ?? '').trim().split(/\s+/)[0] || '—'
}
