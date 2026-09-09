import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { CalorieRing } from './CalorieRing'

/** The arc's length: the ring is drawn by moving the dash offset along this circumference. */
const CIRCUMFERENCE = 314

/** The drawn arc, which is the second circle; the first is the empty track behind it. */
function arc(container: HTMLElement) {
  const circles = container.querySelectorAll('circle')
  return circles[1]
}

describe('CalorieRing', () => {
  it('shows the numbers a person reads off it', () => {
    render(<CalorieRing current={1234} goal={2100} />)

    // Grouped the Brazilian way, because that is the product's language and "1234 kcal"
    // reads as a different number at a glance.
    expect(screen.getByText('1.234')).toBeInTheDocument()
    expect(screen.getByText(/2\.100 kcal/)).toBeInTheDocument()
  })

  it('draws nothing at zero and the full ring at the goal', () => {
    const { container: empty } = render(<CalorieRing current={0} goal={2000} />)
    expect(arc(empty)).toHaveAttribute('stroke-dashoffset', String(CIRCUMFERENCE))

    const { container: full } = render(<CalorieRing current={2000} goal={2000} />)
    expect(arc(full)).toHaveAttribute('stroke-dashoffset', '0')
  })

  it('stops at full instead of overdrawing past the goal', () => {
    // Eating twice the target is entirely possible. Without the clamp the offset goes
    // negative and the arc winds back around, showing a nearly empty ring to someone who
    // is well over their goal.
    const { container } = render(<CalorieRing current={4200} goal={2100} />)

    expect(arc(container)).toHaveAttribute('stroke-dashoffset', '0')
  })

  it('draws an empty ring when no goal is set', () => {
    // A new account has no target yet. Dividing by zero would put NaN in the attribute and
    // the arc would not render at all.
    const { container } = render(<CalorieRing current={500} goal={0} />)

    expect(arc(container)).toHaveAttribute('stroke-dashoffset', String(CIRCUMFERENCE))
  })

  it('draws half the ring at half the goal', () => {
    const { container } = render(<CalorieRing current={1050} goal={2100} />)

    expect(arc(container)).toHaveAttribute('stroke-dashoffset', String(CIRCUMFERENCE / 2))
  })
})
