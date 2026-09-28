import { describe, expect, it } from 'vitest'

import { portionsFor } from './portions'

/**
 * Which portions a food offers.
 *
 * Nobody eats "100 grams of bread": they eat one roll, half a roll, two rolls. Offering the
 * wrong unit is what made the first real user call the screen "extremely horrible", so the
 * portions being right for the food is the whole point of this module.
 *
 * Until the catalogue carried a family, this was a regular expression over the name, which only
 * works when the word happens to be written: "Pão francês" matched and "Bisnaguinha" did not.
 * The category comes from the catalogue file, where somebody looked at the food and classified
 * it, and it covers what the name misses.
 */
describe('portionsFor', () => {
  it('uses the name when it recognises the food, because a name is more specific than a family', () => {
    // TREAT covers both a biscuit and a soft drink, and a glass is not a portion of biscuit.
    expect(portionsFor('Refrigerante de cola', 'TREAT').map((p) => p.key)).toEqual([
      'glassSmall',
      'glass',
      'bottle',
    ])
  })

  it('falls back to the family for a food the name does not recognise', () => {
    /*
     * "Bisnaguinha" is bread and contains none of the words the regular expression looks for.
     * Before the category it fell through to the generic 50/100/200g, which asks somebody who
     * ate two little rolls to weigh them.
     */
    expect(portionsFor('Bisnaguinha', 'BREAD').map((p) => p.key)).toEqual([
      'halfUnit',
      'unit',
      'twoUnits',
    ])
    expect(portionsFor('Contrafilé grelhado', 'PROTEIN').map((p) => p.key)).toEqual([
      'smallPiece',
      'piece',
      'bigPiece',
    ])
    // "Lasanha" carries none of the words either regular expression looks for.
    expect(portionsFor('Lasanha', 'DISH').map((p) => p.key)).toEqual([
      'plateHalf',
      'plateFull',
      'lots',
    ])
  })

  it('a prepared dish is a bigger plate than a side of rice', () => {
    // A dish is the whole meal, so its portions have to weigh more than a spoon of a staple, or
    // choosing "half a plate" of lasagne would under-report every time.
    const dish = portionsFor('Lasanha', 'DISH')
    const staple = portionsFor('Arroz branco cozido', 'STAPLE')

    expect(dish[0].grams).toBeGreaterThan(staple[0].grams)
  })

  it('falls back to the generic portions with no category at all', () => {
    // A hand-typed food and a photo have no family: the honest answer is fractions of 100g,
    // which is the base the catalogue numbers are expressed in.
    expect(portionsFor('Sopa da minha avó').map((p) => p.key)).toEqual([
      'littleBit',
      'normal',
      'lots',
    ])
    expect(portionsFor('Sopa da minha avó', 'OTHER').map((p) => p.key)).toEqual([
      'littleBit',
      'normal',
      'lots',
    ])
  })
})
