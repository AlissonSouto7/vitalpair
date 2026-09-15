import type { ElementType, HTMLAttributes, ReactNode } from 'react'

/**
 * A surface that holds one thing.
 *
 * There is a `.card` utility in index.css, and it is not enough: 46 places use it and 38
 * write `border border-hair bg-surface` by hand, in 23 different combinations of radius,
 * padding and shadow. A CSS class is an invitation; a component is a contract. With this,
 * a screen cannot quietly invent its own card, which is how a product ends up with three
 * corner radii for the same kind of object.
 *
 * Deliberately small. `padding` and `tone` are the only knobs, because every extra prop is
 * a way for the next screen to look different from this one. A card that needs more than
 * this is a screen problem, not a component problem.
 */
type Padding = 'none' | 'tight' | 'normal' | 'roomy'
type Tone = 'plain' | 'quiet' | 'danger'

const padding: Record<Padding, string> = {
  none: '',
  tight: 'p-3',
  normal: 'p-4',
  roomy: 'p-5',
}

const tone: Record<Tone, string> = {
  plain: 'border-hair bg-surface',
  // No fill and no shadow: for a block that groups things without claiming to be an object
  // of its own, such as a section of a settings screen.
  quiet: 'border-hair bg-transparent',
  // Only for what destroys something. The border carries the warning; the fill would make
  // the whole block read as an error that already happened.
  danger: 'border-danger-soft bg-surface',
}

interface CardProps extends HTMLAttributes<HTMLElement> {
  as?: ElementType
  padding?: Padding
  tone?: Tone
  /** Raises the card off the page. Off by default: most cards sit flat in a list. */
  raised?: boolean
  children: ReactNode
}

export function Card({
  as: Tag = 'div',
  padding: pad = 'normal',
  tone: skin = 'plain',
  raised = false,
  className = '',
  children,
  ...rest
}: CardProps) {
  return (
    <Tag
      className={`rounded-xl border ${tone[skin]} ${padding[pad]} ${
        raised ? 'shadow-[0_2px_8px_var(--arena-shadow)]' : ''
      } ${className}`}
      {...rest}
    >
      {children}
    </Tag>
  )
}
