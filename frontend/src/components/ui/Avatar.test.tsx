import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Avatar } from './Avatar'

/** O triângulo do canto, que só o par tem. Marcado como decorativo, logo sem papel. */
function cutCorner(container: HTMLElement) {
  return container.querySelector('[aria-hidden="true"]')
}

describe('Avatar', () => {
  it('tells the two people apart by shape, not only by colour', () => {
    // Azul e bordô ficam a cerca de 1,3:1 um do outro: em preto e branco, num avatar de
    // 22px ou para quem tem daltonismo, a cor sozinha não diz quem é quem.
    const { container: partner } = render(<Avatar initial="B" tone="rival" />)
    const { container: you } = render(<Avatar initial="A" tone="you" />)

    expect(cutCorner(partner)).not.toBeNull()
    expect(cutCorner(you)).toBeNull()
  })

  it('draws the corner with real width, not a zero-sized box', () => {
    // O triângulo é feito de borda: sem largura, o elemento existe e ocupa zero pixel, e o
    // defeito não aparece em lugar nenhum. A largura sai do tamanho do avatar, então é
    // conferida em dois tamanhos: uma constante disfarçada passaria no primeiro.
    //
    // Comparado com Number, e não com a string '0px': sem estilo inline o jsdom devolve
    // string vazia, não zero, e a versão anterior deste teste passava com o estilo removido.
    for (const size of [40, 24]) {
      const { container } = render(<Avatar initial="B" tone="rival" size={size} />)
      const style = getComputedStyle(cutCorner(container)!)

      expect(Number.parseFloat(style.borderBottomWidth)).toBeGreaterThan(0)
      expect(Number.parseFloat(style.borderLeftWidth)).toBeCloseTo(size * 0.28, 1)
    }
  })

  it('falls back to the initial when the photo fails to load', () => {
    // Uma foto que sumiu do servidor deixaria o ícone de imagem quebrada no lugar do rosto.
    // Buscado pelo elemento, e não por papel: alt="" torna a imagem decorativa de propósito,
    // porque o nome da pessoa já está no texto ao lado em toda tela que usa isto.
    const { container } = render(<Avatar initial="A" art="https://exemplo.invalido/sumiu.jpg" />)

    fireEvent.error(container.querySelector('img')!)

    expect(screen.getByText('A')).toBeInTheDocument()
  })

  it('shows the initial when there is no photo at all', () => {
    render(<Avatar initial="A" art={null} />)

    expect(screen.getByText('A')).toBeInTheDocument()
  })
})
