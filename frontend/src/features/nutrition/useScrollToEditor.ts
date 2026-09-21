import { useEffect, useRef } from 'react'

/**
 * Leva a pessoa até o editor no momento em que ele aparece.
 *
 * Medido num iPhone antes desta correção: ao tocar no "+" de um resultado da busca, o editor
 * era inserido a 2190px do topo numa tela de 844px, ou seja 1346px abaixo do que a pessoa
 * estava vendo, e nada a levava até lá. O único sinal de que algo tinha acontecido era uma
 * barra surgindo no rodapé. Ela tocava, "não acontecia nada", e tocava de novo.
 *
 * `smooth` porque o movimento é o que informa que algo aconteceu: um salto seco parece que a
 * tela trocou sozinha. `block: 'start'` e não `'center'` porque o editor é mais alto que a
 * tela de um celular, e centralizar deixaria o título fora de vista, que é justamente a parte
 * que diz o que abriu.
 *
 * @param key identifica o item em edição. Muda quando outro alimento é escolhido, e é o que
 *   dispara a rolagem; `null` quando não há editor aberto. Não é o objeto inteiro de
 *   propósito: ele é recriado a cada tecla digitada, o que rolaria a tela no meio da digitação.
 */
export function useScrollToEditor(key: string | null) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (key === null) return
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [key])

  return ref
}
