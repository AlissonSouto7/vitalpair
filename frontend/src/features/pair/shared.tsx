import { RELATIONSHIP_VALUES, type TFn } from './pairText'

import { Select } from '@/components/ui/Select'
import { Field } from '@/shared/ui/form/Field'
import type { Pair, RelationshipType } from '@/types/pair'

/**
 * The pieces both halves of the pair screen use.
 *
 * The screen shows one of two things depending on whether a pair exists, and these are what
 * they have in common: the relationship picker sits on both, and the name helpers format the
 * same members. Their own module so neither half has to import from the other.
 */

/**
 * Mirrors how AuthService generates a code: eight characters from an alphabet without
 * I, O, 0 and 1, the ones people misread. Trimmed and uppercased first, so a code pasted
 * with a space or typed in lowercase still matches, and a blank never reaches the server.
 */

export function RelationCard({
  pair,
  onChange,
  t,
}: {
  pair: Pair | null
  onChange: (type: RelationshipType) => void
  t: TFn
}) {
  const relationshipOptions = RELATIONSHIP_VALUES.map((v) => ({
    value: v,
    label: t(`pair.rel.${v}`),
  }))
  return (
    <div className="card">
      <Field label={t('pair.relType')} hint={t('pair.relTypeHint')}>
        {(field) => (
          <Select
            {...field}
            value={pair?.relationshipType ?? 'PAIR'}
            onChange={onChange}
            options={relationshipOptions}
          />
        )}
      </Field>
    </div>
  )
}

/* ---------- ícones SVG preenchidos ---------- */

export function IconCopy() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
      <path d="M16 1H4a2 2 0 0 0-2 2v12h2V3h12V1zm3 4H8a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2zm0 16H8V7h11v14z" />
    </svg>
  )
}

export function IconCheck() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
      <path d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z" />
    </svg>
  )
}

export function IconLink() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
      <path d="M3.9 12a3.1 3.1 0 0 1 3.1-3.1h4V7H7a5 5 0 0 0 0 10h4v-1.9H7A3.1 3.1 0 0 1 3.9 12zM8 13h8v-2H8v2zm9-6h-4v1.9h4a3.1 3.1 0 0 1 0 6.2h-4V17h4a5 5 0 0 0 0-10z" />
    </svg>
  )
}

export function IconPlus() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
      <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
    </svg>
  )
}

export function IconQuestion() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6 fill-current">
      <path d="M11.07 12.85c.77-1.39 2.25-2.21 3.11-3.44.91-1.29.4-3.7-2.18-3.7-1.69 0-2.52 1.28-2.87 2.34L6.54 6.96C7.25 4.83 9.18 3 11.99 3c2.35 0 3.96 1.07 4.78 2.41.7 1.15 1.11 3.3.03 4.9-1.2 1.77-2.35 2.31-2.97 3.45-.25.46-.35.76-.35 2.24h-2.89c0-.78-.12-2.05.48-3.15zM14 20a2 2 0 1 1-4 0 2 2 0 0 1 4 0z" />
    </svg>
  )
}

export function IconKey() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
      <path d="M12.65 10A6 6 0 1 0 7 14a5.94 5.94 0 0 0 1.65-.24L11 16l2 2 2-2 2 2 3-3-7.35-5zM7 12a2 2 0 1 1 0-4 2 2 0 0 1 0 4z" />
    </svg>
  )
}

export function IconAlert() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 fill-current">
      <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
    </svg>
  )
}
