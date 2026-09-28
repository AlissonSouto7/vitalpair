/**
 * The family of a food, drawn as an icon.
 *
 * A results list carrying only names and calories makes somebody read eight similar lines to
 * find theirs. A word and a small drawing per line move the triage ahead of the reading:
 * whoever searched for "frango" recognises the meat without parsing the sentence.
 *
 * Drawn in code, not an emoji and not an icon font. An emoji renders as a different picture on
 * every platform and carries its own colour, which would fight the palette; a font is a
 * download for nine shapes. These are the same 24-unit box, `currentColor` and `aria-hidden`
 * as the rest of `icons.tsx`, so they inherit the colour of the text they sit next to.
 *
 * All of them are the same neutral grey, on purpose. Green, red and amber mean a result in this
 * product (a goal met, a loss, something pending), and a food family is neither good nor bad:
 * spending a semantic colour on "fruit" would teach the wrong code and make the list louder
 * without saying anything. The food name stays the thing that stands out.
 */

import type { FoodCategory } from '@/types/nutrition'

function Icon({ path }: { path: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4 shrink-0 text-muted"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d={path} />
    </svg>
  )
}

/** A bowl: rice, beans, pasta, the base of the plate. */
const STAPLE = 'M3 11h18a9 9 0 0 1-9 9 9 9 0 0 1-9-9zm2-5h2v3H5zm4-2h2v5H9zm4 1h2v4h-2z'

/** A drumstick: meat, egg, fish. */
const PROTEIN =
  'M14.5 3a5.5 5.5 0 0 0-4.6 8.5l-1.6 1.6a3 3 0 1 0-2.6 4.6L3 20.3 4.7 22l2.6-2.7a3 3 0 1 0 4.6-2.6l1.6-1.6A5.5 5.5 0 0 0 14.5 3z'

/**
 * A slice of sandwich bread: bread, biscuits, breakfast.
 *
 * The domed top over straight sides is the silhouette everyone reads as bread. The earlier
 * drawing was a rounded rectangle with a band across it, which at 16px read as a pot.
 */
const BREAD =
  'M12 3c4.4 0 8 1.8 8 4.2 0 1.4-1.1 2.3-2.3 2.6V19a2 2 0 0 1-2 2H8.3a2 2 0 0 1-2-2V9.8C5.1 9.5 4 8.6 4 7.2 4 4.8 7.6 3 12 3z'

/**
 * A milk carton with its folded gable: milk, cheese, yoghurt.
 *
 * The gable is the whole point. Without it the shape is a rectangle with a square on it, which
 * at 16px read as a tin or a battery.
 */
const DAIRY = 'M9 2h6v1.6l3 3.2V20a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V6.8l3-3.2zm1.6 8.4v3.2h2.8v-3.2z'

/**
 * An apple: two lobes, a stalk and a leaf.
 *
 * The two lobes and the notch between them are what say "apple". The earlier drawing was one
 * round blob whose leaf disappeared at small sizes, and it read as a pear at best.
 */
const FRUIT =
  'M12.4 6.6c1-.9 2.2-1.3 3.4-1.1 2.4.4 4.2 3 4.2 6.2 0 4.2-2.6 9.3-5.1 9.3-1 0-1.6-.5-2.9-.5s-1.9.5-2.9.5C6.6 21 4 15.9 4 11.7c0-3.2 1.8-5.8 4.2-6.2 1.3-.2 2.6.3 3.6 1.3zM12.2 5V2.8c0-.4.3-.8.8-.8h.6v.8c0 1.1-.6 2-1.4 2.2zm2.1-.6c.3-1.3 1.5-2.3 2.9-2.3-.1 1.4-1.2 2.5-2.6 2.6z'

/**
 * A leaf on its stalk: vegetables and salad.
 *
 * Filled, with the midrib cut out of it. The earlier drawing was an outline, so among nine
 * solid icons it looked faded rather than different, which reads as "disabled".
 */
const VEGETABLE =
  'M20.5 3.5C9.9 4.3 4.4 9.4 4.4 16.2c0 .9.1 1.7.4 2.5L9.6 13l1.2 1.2-5 5.1c.9.4 1.9.6 2.9.6 6.6 0 11.5-5.4 11.8-16.4zM3.6 19.8 2.4 21l1.2 1.2 1.2-1.2z'

/** An ice cream: snacks, sweets, drinks. */
const TREAT = 'M12 2a5 5 0 0 0-5 5h10a5 5 0 0 0-5-5zM7.5 9h9L12 22z'

/**
 * A plate between a fork and a knife: a prepared dish.
 *
 * The cutlery is beside the plate, not inside it. Drawn inside, at the 16px this renders at,
 * the tines and the blade collapsed into two specks in a circle: measured on an iPhone 12, the
 * icon for "Arroz carreteiro" read as a circle with two dashes and said nothing about food.
 * Outside, the silhouette survives, which is the only thing that matters at this size.
 */
const DISH =
  'M2 3h1.6v7H5V3h1.6v7.4a2.6 2.6 0 0 1-1.8 2.4V21H3.4v-8.2A2.6 2.6 0 0 1 2 10.4zm18.4 0V21h-1.6v-6.6h-2V7.6C16.8 5 18 3 20.4 3zM12 6.5a5.5 5.5 0 1 1 0 11 5.5 5.5 0 0 1 0-11zm0 1.8a3.7 3.7 0 1 0 0 7.4 3.7 3.7 0 0 0 0-7.4z'

/**
 * A tub with a wide lid and a label: supplements.
 *
 * A protein tub, not a glass. The earlier drawing tapered like a cup and could have been any
 * drink, which is the one thing a supplement is not.
 */
const SUPPLEMENT =
  'M7 2h10a1 1 0 0 1 1 1v2.2a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1zm-.4 6.2h10.8L17 20.4a1.8 1.8 0 0 1-1.8 1.6H8.8A1.8 1.8 0 0 1 7 20.4zm2.2 3.4v2.8h5.4v-2.8z'

/** Anything with no known family, which is every branded product. */
const OTHER =
  'M12 2 3 7v10l9 5 9-5V7zm0 2.3 6.5 3.6L12 11.5 5.5 7.9zM5 9.7l6 3.3v6.3l-6-3.3zm14 0v6.3l-6 3.3V13z'

const PATHS: Record<FoodCategory, string> = {
  STAPLE,
  PROTEIN,
  BREAD,
  DAIRY,
  FRUIT,
  VEGETABLE,
  TREAT,
  DISH,
  SUPPLEMENT,
  OTHER,
}

export function CategoryIcon({ category }: { category: FoodCategory }) {
  // A category the backend added and the frontend does not know yet falls back to OTHER rather
  // than rendering a hole where the drawing should be.
  return <Icon path={PATHS[category] ?? OTHER} />
}
