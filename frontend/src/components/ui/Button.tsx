import type { ButtonHTMLAttributes, ReactNode } from 'react'

/**
 * The product's button, and the one place the colour law for actions is written down.
 *
 * The law has one rule that is easy to get wrong: **the action colour is never a person's
 * colour**. Blue is "you" and burgundy is "your partner"; if the primary button were blue,
 * you would carry the weight of the whole system and your partner would not, in a product
 * whose entire premise is that the two of you compete on equal terms. So the action is
 * orange, and orange identifies nobody.
 *
 * `danger` is the only red in the product. Red never touches food, weight or the
 * scoreboard: losing a day is a pending thing, not a failure, and a red meal reads as a
 * verdict on what somebody ate.
 */
type Variant = 'primary' | 'secondary' | 'quiet' | 'danger'

const styles: Record<Variant, string> = {
  primary: 'bg-act text-on-fill hover:brightness-110',
  // The action colour at low weight: for a second action that is still an action, like
  // "swap this meal", next to a primary that must stay louder.
  secondary: 'bg-act-soft text-act-ink hover:brightness-95',
  quiet: 'border border-hair bg-transparent text-ink hover:bg-track',
  danger: 'bg-danger-soft text-danger hover:brightness-95',
}

const sizes = {
  sm: 'px-3.5 py-2 text-[13px]',
  md: 'px-[18px] py-3 text-sm',
} as const

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: keyof typeof sizes
  /** Fills the line it sits on. For the single action at the bottom of a card. */
  block?: boolean
  children: ReactNode
}

export function Button({
  variant = 'primary',
  size = 'md',
  block = false,
  className = '',
  type = 'button',
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-sans font-extrabold transition disabled:cursor-not-allowed disabled:opacity-60 ${
        styles[variant]
      } ${sizes[size]} ${block ? 'w-full' : ''} ${className}`}
      {...rest}
    >
      {children}
    </button>
  )
}
