import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Broto } from './Broto'

/**
 * Quem decide a cara do bicho.
 *
 * O rosto era escolhido pelo PAPEL no par: `who === 'partner' ? 'f' : 'm'`, dentro deste
 * componente. Quem entrava como "você" recebia sobrancelhas grossas, sempre, inclusive a
 * primeira usuária do app, que tinha marcado sexo feminino no cadastro e perguntou como
 * trocar o mascote. Não havia como, porque o desenho nunca olhou para o perfil.
 *
 * A diferença entre as duas aparências, no desenho, são os cílios: quatro traços finos
 * acima dos olhos. Contar traços é feio, mas é o que distingue um rosto do outro sem
 * depender de um atributo que o SVG não expõe.
 */
function tracos(container: HTMLElement): number {
  // Os cílios são os únicos <path> com traço fino (1.8) no rosto; as sobrancelhas usam 3.
  return container.querySelectorAll('path[stroke-width="1.8"]').length
}

describe('Broto', () => {
  it('desenha os cílios quando a pessoa escolheu a Florzinha', () => {
    const { container } = render(<Broto who="you" mascot="BLOSSOM" />)

    expect(tracos(container)).toBeGreaterThan(0)
  })

  it('não desenha os cílios quando a pessoa escolheu o Broto', () => {
    const { container } = render(<Broto who="you" mascot="SPROUT" />)

    expect(tracos(container)).toBe(0)
  })

  it('a escolha vence o papel no par', () => {
    // O ponto de toda a mudança: quem é "você" pode ter a Florzinha, e quem é o par pode
    // ter o Broto. Antes, o papel decidia e não havia escolha nenhuma.
    const voce = render(<Broto who="you" mascot="BLOSSOM" />)
    expect(tracos(voce.container)).toBeGreaterThan(0)
    voce.unmount()

    const par = render(<Broto who="partner" mascot="SPROUT" />)
    expect(tracos(par.container)).toBe(0)
  })

  it('sem escolha, mantém o desenho de antes', () => {
    // Quem já usava o app não pode ver o bicho mudar sozinho por causa desta mudança.
    const voce = render(<Broto who="you" />)
    expect(tracos(voce.container)).toBe(0)
    voce.unmount()

    const par = render(<Broto who="partner" />)
    expect(tracos(par.container)).toBeGreaterThan(0)
  })
})
