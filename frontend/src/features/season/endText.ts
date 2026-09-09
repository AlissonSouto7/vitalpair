/**
 * How names are written on the end-of-season screen.
 *
 * The fallback initial is 'P' here where the season screen's is '?'. They look like
 * duplicates and are not, so they stay separate.
 */

export function initial(name: string): string {
  return name.trim().charAt(0).toUpperCase() || 'P'
}
export function lowerFirst(s: string): string {
  return s.charAt(0).toLowerCase() + s.slice(1)
}
