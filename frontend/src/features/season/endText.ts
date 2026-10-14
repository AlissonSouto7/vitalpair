/**
 * Wording particular to the end-of-season screen.
 *
 * `initial` used to live here too, with 'P' where the season screen used '?'. A note said
 * they were not duplicates for that reason. The 'P' was the weaker half: it reads as the
 * initial of a person named P, so the shared helper's '?' replaced it.
 */

export function lowerFirst(s: string): string {
  return s.charAt(0).toLowerCase() + s.slice(1)
}
