import type { ButtonHTMLAttributes, ReactNode } from 'react'

/**
 * The product's button, and the one place the colour law for buttons is written down:
 * orange is the primary action, green a positive health action, the rest secondary.
 *
 * No screen uses it yet: there are 65 hand-written `<button>` elements across 20 files,
 * 38 of them repeating the primary style. It stays because it is where that design
 * decision lives, and the standardisation belongs to phase 10, which already opens every
 * page. Listed in `knip.json` so the dead-code check does not ask for its removal daily.
 */
type Variant = 'primary' | 'secondary' | 'success' | 'ghost'

const styles: Record<Variant, string> = {
  // laranja = ação principal / "você"
  primary: 'bg-brand text-white hover:brightness-105',
  secondary: 'border border-hair bg-transparent text-ink hover:bg-surface',
  // verde = ação positiva de saúde (ex.: topar missão)
  success: 'bg-success text-white hover:brightness-105',
  ghost: 'bg-transparent text-muted hover:text-ink',
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  children: ReactNode
}

export function Button({ variant = 'primary', className = '', children, ...rest }: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-[18px] py-3 font-sans text-sm font-extrabold transition disabled:opacity-60 ${styles[variant]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  )
}
