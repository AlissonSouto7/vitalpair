import { describe, expect, it } from 'vitest'

import { firstName, initial } from './name'

/**
 * These two lines were copied into nine places, and the copies had drifted in the only
 * part that is a product decision: the fallback. The dashboard and the feed answered 'A',
 * left over from the example data the redesign used ("Ana"), and the end-of-season screen
 * answered 'P', for "Par". Both render inside an avatar, where a letter reads as somebody's
 * initial, so a row whose name had not loaded showed a confident initial for a person who
 * was not there.
 *
 * What these tests hold in place is that the fallback stays a question mark. There was no
 * test on any of the nine copies, which is how three different answers survived.
 */
describe('initial', () => {
  it('takes the first letter and upper-cases it', () => {
    expect(initial('Célia')).toBe('C')
    expect(initial('alisson')).toBe('A')
  })

  it('answers with a question mark when there is no name, never a letter', () => {
    // O caso real: par que ainda não existe (partnerName: string | null) ou consulta que
    // não resolveu (me?.name). Uma letra aqui afirma um nome que ninguém tem.
    for (const semNome of [undefined, null, '', '   ', '\t']) {
      expect(initial(semNome)).toBe('?')
    }
  })

  it('ignores the space somebody typed before their name', () => {
    expect(initial('  Célia')).toBe('C')
  })

  it('keeps the accent instead of stripping it', () => {
    // 'Ângela' tem de dar 'Â', e não 'A': é a inicial dela.
    expect(initial('Ângela')).toBe('Â')
  })
})

describe('firstName', () => {
  it('takes only the first name', () => {
    expect(firstName('José Antônio da Silva')).toBe('José')
  })

  it('splits on any whitespace, not just on a space', () => {
    expect(firstName('  Ana   Paula ')).toBe('Ana')
    // A tabulacao e o que separa split(/\s+/) de split(' '): com split(' ') o nome
    // inteiro volta como primeiro pedaco, e a linha do placar quebra do mesmo jeito.
    expect(firstName('Ana\tPaula')).toBe('Ana')
    expect(firstName('Ana\nPaula')).toBe('Ana')
  })

  it('answers with a dash when there is no name', () => {
    for (const semNome of [undefined, null, '', '   ']) {
      expect(firstName(semNome)).toBe('—')
    }
  })

  it('leaves a single name alone', () => {
    expect(firstName('Célia')).toBe('Célia')
  })
})
