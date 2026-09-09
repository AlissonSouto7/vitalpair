import { useState } from 'react'

import { Select } from './Select'

const MONTHS = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
]

interface DateParts {
  d: string
  m: string
  y: string
}

const EMPTY: DateParts = { d: '', m: '', y: '' }

function split(iso: string): DateParts {
  if (!iso) return EMPTY
  const [y = '', m = '', d = ''] = iso.split('-')
  return { d, m, y }
}

/** The ISO form, or `''` while any part is still missing. */
function join({ d, m, y }: DateParts): string {
  return d && m && y ? `${y}-${m}-${d}` : ''
}

/**
 * A date as three dropdowns: day, month and year, without the browser's own calendar and
 * without letting anyone pick a date in the future. value and onChange use ISO
 * `yyyy-mm-dd`, or `''` while the date is still incomplete.
 *
 * Three controls cannot share one label, so the group carries the name instead and each
 * dropdown announces its own placeholder under it. Pointing a single `<label htmlFor>` at
 * the group does not do that: a label names a form control, and a `role="group"` div is
 * not one, so the group came out anonymous and a screen reader read three unnamed
 * dropdowns. `aria-labelledby` is what actually names a group, which is why `labelId` is
 * required rather than optional.
 *
 * The three parts are held here rather than derived from `value` on every render. A date
 * with only the day chosen has no ISO form, so a component that read its state back out
 * of `value` alone would show the placeholder again the instant someone picked a day, and
 * the date could never be completed. `value` still wins whenever it names a different
 * date, so a parent that resets or loads a profile is obeyed.
 */
export function DateField({
  id,
  labelId,
  value,
  onChange,
  'aria-describedby': describedBy,
}: {
  id?: string
  /** The id of the element whose text names this group. */
  labelId: string
  value: string
  onChange: (iso: string) => void
  'aria-describedby'?: string
}) {
  const [parts, setParts] = useState(() => split(value))

  // Loading a profile or clearing the form has to win over what is on screen, so a value
  // the parent changed on its own replaces the parts. Adjusting during render rather than
  // in an effect is React's own answer to deriving state from a prop: an effect would paint
  // the stale date first and then correct it. `lastValue` is what distinguishes a change
  // made out there from the one this component just reported: mid-fill the parent holds ''
  // while the parts hold a day, and that pair has to survive.
  const [lastValue, setLastValue] = useState(value)
  if (value !== lastValue) {
    setLastValue(value)
    setParts(split(value))
  }

  const { d, m, y } = parts
  const thisYear = new Date().getFullYear()

  const dayOpts = Array.from({ length: 31 }, (_, i) => {
    const dd = String(i + 1).padStart(2, '0')
    return { value: dd, label: String(i + 1) }
  })
  const monthOpts = MONTHS.map((label, i) => ({ value: String(i + 1).padStart(2, '0'), label }))
  // de 13 anos atrás até 100 anos antes disso — faixa razoável para data de nascimento
  const yearOpts = Array.from({ length: 100 }, (_, i) => {
    const yy = String(thisYear - 13 - i)
    return { value: yy, label: yy }
  })

  function set(next: DateParts) {
    setParts(next)
    onChange(join(next))
  }

  return (
    <div
      id={id}
      role="group"
      aria-labelledby={labelId}
      aria-describedby={describedBy}
      className="grid grid-cols-[1fr_1.4fr_1fr] gap-2"
    >
      <Select
        value={d}
        onChange={(nd) => set({ ...parts, d: nd })}
        options={dayOpts}
        placeholder="Dia"
      />
      <Select
        value={m}
        onChange={(nm) => set({ ...parts, m: nm })}
        options={monthOpts}
        placeholder="Mês"
      />
      <Select
        value={y}
        onChange={(ny) => set({ ...parts, y: ny })}
        options={yearOpts}
        placeholder="Ano"
      />
    </div>
  )
}
