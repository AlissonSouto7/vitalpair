/**
 * Avatar em tile arredondado. Cor por papel:
 *   tone="you"   → laranja (você)
 *   tone="rival" → roxo (a Célia / o par)
 *   tone="ghost" → cinza neutro (sua versão da semana passada, no modo solo)
 * O personagem evolutivo entra aqui depois como ilustração real (prop `art`).
 */
type Tone = 'you' | 'rival' | 'ghost'

const toneCls: Record<Tone, string> = {
  you: 'bg-brand text-white',
  rival: 'bg-rival text-white',
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
  art?: string // url da ilustração do personagem, quando houver
}) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-[28%] font-display font-semibold ${toneCls[tone]}`}
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {art ? <img src={art} alt="" className="h-full w-full object-cover" /> : initial}
    </span>
  )
}
