import { useState } from 'react'

/**
 * The face of one person, and the one place the identity law is written down.
 *
 * Both squares look alike on purpose, because a profile photo fills the tile and takes the
 * colour with it. What tells the two apart survives that:
 *
 *   - a **ring** in the person's colour, outside the tile, still visible under a photo;
 *   - a **cut corner**, on the partner only, which survives greyscale and a tiny size.
 *
 * The ring is not decoration. Blue and burgundy sit at about 1,3:1 from each other, so in
 * greyscale, in a thumbnail, or for a person with colour blindness, colour alone says
 * nothing about who is who. On a scoreboard that is the whole information.
 *
 * `tone="ghost"` is you last week, in solo mode: no ring, because it is not a second person.
 */
type Tone = 'you' | 'rival' | 'ghost'

const fill: Record<Tone, string> = {
  you: 'bg-you text-on-fill',
  rival: 'bg-pair text-on-fill',
  ghost: 'bg-track text-muted border border-dashed border-muted/50',
}

const ring: Record<Tone, string> = {
  you: 'shadow-[0_0_0_2px_var(--surface),0_0_0_4px_var(--you)]',
  rival: 'shadow-[0_0_0_2px_var(--surface),0_0_0_4px_var(--pair)]',
  ghost: '',
}

export function Avatar({
  initial,
  tone = 'you',
  size = 40,
  art,
}: {
  initial: string
  tone?: Tone
  size?: number
  /**
   * URL da imagem: a foto de perfil da pessoa ou, mais adiante, a arte do personagem.
   *
   * Aceita null, e não só undefined, porque é o que o perfil devolve quando não há foto: quem
   * chama repassa o valor direto em vez de convertê-lo em cada uma das nove telas que mostram
   * um rosto. Sem imagem, cai na inicial.
   */
  art?: string | null
}) {
  const [failed, setFailed] = useState(false)

  return (
    <span className="relative inline-flex shrink-0" style={{ width: size, height: size }}>
      <span
        className={`inline-flex h-full w-full items-center justify-center overflow-hidden rounded-[26%] font-display font-semibold ${fill[tone]} ${ring[tone]}`}
        style={{ fontSize: size * 0.4 }}
      >
        {/*
          alt="" de propósito: quem usa leitor de tela já recebe o nome da pessoa no texto ao lado,
          em todos os lugares que usam este componente, então descrever a imagem diria o nome duas
          vezes seguidas.

          O onError volta pra inicial em vez de deixar o ícone de imagem quebrada, que é o que
          apareceria se o arquivo sumisse do servidor (conta encerrada, volume remontado). Estado
          e não style.display: esconder o <img> deixaria o quadrado vazio, porque a inicial só
          entra na árvore quando não há imagem.
        */}
        {art && !failed ? (
          <img
            src={art}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover"
            onError={() => setFailed(true)}
          />
        ) : (
          initial
        )}
      </span>

      {/*
        O canto recortado do par. Um triângulo da cor do fundo, por cima da foto, no canto
        de baixo à direita. É o sinal que sobra quando a cor não ajuda: preto e branco,
        avatar de 22px numa linha de feed, ou daltonismo.
      */}
      {tone === 'rival' && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute bottom-0 right-0 border-l-transparent border-b-surface"
          style={{ borderLeftWidth: size * 0.28, borderBottomWidth: size * 0.28 }}
        />
      )}
    </span>
  )
}
