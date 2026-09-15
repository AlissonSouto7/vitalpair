import { useState } from 'react'

/**
 * Avatar em tile arredondado. Cor por papel:
 *   tone="you"   → laranja (você)
 *   tone="rival" → roxo (o par)
 *   tone="ghost" → cinza neutro (sua versão da semana passada, no modo solo)
 * O personagem evolutivo entra aqui depois como ilustração real (prop `art`).
 */
type Tone = 'you' | 'rival' | 'ghost'

const toneCls: Record<Tone, string> = {
  you: 'bg-brand text-on-fill',
  rival: 'bg-rival text-on-fill',
  ghost: 'bg-track text-muted border border-dashed border-muted/50',
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
    <span
      className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-[28%] font-display font-semibold ${toneCls[tone]}`}
      style={{ width: size, height: size, fontSize: size * 0.4 }}
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
  )
}
