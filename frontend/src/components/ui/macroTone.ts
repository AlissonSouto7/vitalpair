/**
 * The colour of each macro, in one place.
 *
 * A macro's colour says which macro it is, never how the person is doing: protein is slate,
 * carbohydrate the gold, fat the teal. Fat used the success green, so two bars at the same
 * percentage came out in opposite colours and the greener one read as "doing great", which is
 * why green now belongs only to its own role. The colour law is stated in src/index.css.
 *
 * Protein had the brand orange until the palette split brand into `act` (the system's action)
 * and the two people's colours. Leaving it there would have made a protein bar the same colour
 * as the button below it, which is the confusion the split existed to end.
 *
 * Six components mapped these names to classes with their own ternary chain, which is how the
 * fat/success pairing spread and why fixing it meant six edits. They all read from here now.
 *
 * The names say which macro they are, so a call site reads as what it means.
 */
export type MacroTone = 'protein' | 'carb' | 'fat'

interface MacroClasses {
  /** Fill of a progress bar, or the dot before a label. */
  bg: string
  /** Text colour, the `-ink` variant, which is the one that has to stay readable. */
  text: string
}

export const MACRO_TONES: Record<MacroTone, MacroClasses> = {
  protein: { bg: 'bg-protein', text: 'text-protein-ink' },
  carb: { bg: 'bg-carb', text: 'text-carb-ink' },
  fat: { bg: 'bg-fat', text: 'text-fat-ink' },
}
