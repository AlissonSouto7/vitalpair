/**
 * The colour of each macro, in one place.
 *
 * A macro's colour says which macro it is, never how the person is doing: protein is the brand
 * orange, carbohydrate the gold, fat the teal. Fat used the success green, so two bars at the
 * same percentage came out in opposite colours and the greener one read as "doing great", which
 * is why green now belongs only to its own role. The colour law is stated in src/index.css.
 *
 * Six components mapped these names to classes with their own ternary chain, which is how the
 * fat/success pairing spread and why fixing it meant six edits. They all read from here now.
 *
 * The names are the ones the call sites already pass ('brand' for protein), so adopting this
 * did not require renaming a prop on every screen.
 */
export type MacroTone = 'brand' | 'carb' | 'fat'

interface MacroClasses {
  /** Fill of a progress bar, or the dot before a label. */
  bg: string
  /** Text colour, the `-ink` variant, which is the one that has to stay readable. */
  text: string
}

export const MACRO_TONES: Record<MacroTone, MacroClasses> = {
  brand: { bg: 'bg-brand', text: 'text-brand-ink' },
  carb: { bg: 'bg-carb', text: 'text-carb-ink' },
  fat: { bg: 'bg-fat', text: 'text-fat-ink' },
}
