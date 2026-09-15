import type { ReactNode } from 'react'

/**
 * One number and what it means.
 *
 * The dashboard used to print twenty-one numbers in the first screenful, all at the same
 * weight, which is a control panel rather than a starting point. This exists so a screen
 * has to choose: `size="hero"` is the one number the screen is about, everything else is
 * `"plain"` and steps back.
 *
 * `tone` is not decoration either. Green means done, amber means pending, and the two
 * people's colours identify a person; a number that is only a quantity, like steps or
 * calories burned, stays neutral, because colouring it would imply a judgement the app is
 * not making.
 */
type Size = 'hero' | 'plain' | 'small'
type Tone = 'neutral' | 'action' | 'you' | 'pair' | 'done' | 'pending'

const sizes: Record<Size, string> = {
  hero: 'text-[40px] leading-none',
  plain: 'text-2xl leading-none',
  small: 'text-lg leading-none',
}

const tones: Record<Tone, string> = {
  neutral: 'text-ink',
  action: 'text-act-ink',
  you: 'text-you-ink',
  pair: 'text-pair-ink',
  done: 'text-success-ink',
  pending: 'text-carb-ink',
}

export function Stat({
  value,
  label,
  size = 'plain',
  tone = 'neutral',
  hint,
}: {
  value: ReactNode
  label: string
  size?: Size
  tone?: Tone
  /** A second line under the label, for the detail that would otherwise become its own number. */
  hint?: ReactNode
}) {
  return (
    <div>
      {/*
        tabular-nums so a number that changes does not shift the ones next to it. On a
        scoreboard that updates while you watch, digits of different widths make the layout
        twitch on every point.
      */}
      <div className={`font-display font-semibold tabular-nums ${sizes[size]} ${tones[tone]}`}>
        {value}
      </div>
      <div className="mt-1 text-[11px] font-bold text-muted">{label}</div>
      {hint != null && <div className="mt-0.5 text-[11px] font-semibold text-faint">{hint}</div>}
    </div>
  )
}
