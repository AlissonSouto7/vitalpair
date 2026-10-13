/**
 * The icons more than one feature draws.
 *
 * Each feature keeps its own `icons.tsx` for the drawings only it uses. What lands here is
 * the handful that had drifted into byte-identical copies across features, where the next
 * person to adjust one would have adjusted half the product.
 *
 * Both take the size and the colour as `className` rather than fixing them: the same check
 * is 16px and `fill-current` on the dashboard and 17px and `fill-success` on the missions
 * screen, which is the kind of difference a shared icon has to allow.
 */

/** A tick. Used for anything accepted, done or confirmed. */
export function CheckIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z" />
    </svg>
  )
}

/**
 * A four-pointed sparkle, for "improve your fitness" and for a suggestion.
 *
 * Not to be confused with the other two sparks in the codebase, which look alike by name
 * only: `activity/icons.tsx` draws a lightning bolt and `workoutplan/parts.tsx` draws three
 * stars of different sizes. Those are different drawings, so they stay where they are.
 */
export function IconSpark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 2l1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8z" />
    </svg>
  )
}
