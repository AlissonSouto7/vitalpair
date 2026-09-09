import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'

import { DateField } from './DateField'

/**
 * A controlled wrapper, the way both real callers use it: the parent owns the ISO string
 * and hands it back. Testing the component with a fixed `value` would hide the bug this
 * file exists for, because the bug is that a partial date has nowhere to live.
 */
function Harness() {
  const [value, setValue] = useState('')
  return (
    <>
      <span id="birth">Nascimento</span>
      <DateField labelId="birth" value={value} onChange={setValue} />
      <output data-testid="iso">{value}</output>
    </>
  )
}

async function pick(user: ReturnType<typeof userEvent.setup>, index: number, label: string) {
  const trigger = screen.getAllByRole('combobox')[index]
  await user.click(trigger)
  const listbox = screen.getByRole('listbox')
  await user.click(within(listbox).getByRole('button', { name: label }))
}

describe('DateField', () => {
  it('keeps each part on screen while the date is still incomplete', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    await pick(user, 0, '15')

    // The day the person just chose has to stay visible. It used to fall back to the
    // placeholder, because a partial date could not be represented and the component
    // read its state back out of a value that was still empty.
    expect(screen.getAllByRole('combobox')[0]).toHaveTextContent('15')
  })

  it('emits an ISO date only once all three parts are chosen', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    await pick(user, 0, '15')
    await pick(user, 1, 'Maio')
    expect(screen.getByTestId('iso')).toHaveTextContent('')

    await pick(user, 2, '1995')
    expect(screen.getByTestId('iso')).toHaveTextContent('1995-05-15')
  })

  it('follows the parent when the parent changes the date', async () => {
    const user = userEvent.setup()

    function Controlled() {
      const [value, setValue] = useState('')
      return (
        <>
          <span id="birth">Nascimento</span>
          <DateField labelId="birth" value={value} onChange={setValue} />
          <button type="button" onClick={() => setValue('1980-01-02')}>
            carregar
          </button>
          <button type="button" onClick={() => setValue('')}>
            limpar
          </button>
        </>
      )
    }

    render(<Controlled />)
    await pick(user, 0, '15')
    expect(screen.getAllByRole('combobox')[0]).toHaveTextContent('15')

    // Loading a profile has to win over whatever was half typed.
    await user.click(screen.getByRole('button', { name: 'carregar' }))
    const [day, month, year] = screen.getAllByRole('combobox')
    expect(day).toHaveTextContent('2')
    expect(month).toHaveTextContent('Janeiro')
    expect(year).toHaveTextContent('1980')

    // And so does clearing it.
    await user.click(screen.getByRole('button', { name: 'limpar' }))
    expect(screen.getAllByRole('combobox')[0]).toHaveTextContent('Dia')
  })

  it('shows the parts of a date it was given', () => {
    render(
      <>
        <span id="birth">Nascimento</span>
        <DateField labelId="birth" value="1995-05-15" onChange={() => {}} />
      </>,
    )

    const [day, month, year] = screen.getAllByRole('combobox')
    expect(day).toHaveTextContent('15')
    expect(month).toHaveTextContent('Maio')
    expect(year).toHaveTextContent('1995')
  })
})
