import type { RelationshipType } from '@/types/pair'

/**
 * The values and name formatting the pair screens share.
 *
 * Separate from the components because a file that exports both stops hot reload from
 * working: React cannot tell a changed component from a changed constant, so it reloads the
 * page instead of swapping the component.
 */

export type TFn = (key: string, opts?: Record<string, unknown>) => string

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
