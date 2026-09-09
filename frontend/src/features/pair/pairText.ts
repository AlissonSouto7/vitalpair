import type { TFunction } from 'i18next'

import type { RelationshipType } from '@/types/pair'

/**
 * The values and name formatting the pair screens share.
 *
 * Separate from the components because a file that exports both stops hot reload from
 * working: React cannot tell a changed component from a changed constant, so it reloads the
 * page instead of swapping the component.
 */

/** The translate function, typed against the pt bundle: a wrong key fails tsc. */
export type TFn = TFunction

export const RELATIONSHIP_VALUES: RelationshipType[] = [
  'PAIR',
  'DUO',
  'FRIENDS',
  'CONFIDANTS',
  'BROTHERS',
  'OTHER',
]

export function initial(name?: string | null): string {
  return (name ?? '').trim().charAt(0).toUpperCase() || '?'
}

export function firstName(name?: string | null): string {
  return (name ?? '').trim().split(/\s+/)[0] || '—'
}
