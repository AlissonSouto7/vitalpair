type Status = 'pendente' | 'andamento' | 'revisao' | 'concluida'

const map: Record<Status, { label: string; cls: string }> = {
  pendente: { label: 'Pendente', cls: 'text-muted bg-track' },
  andamento: { label: 'Em andamento', cls: 'text-brand-ink bg-brand-soft' },
  // pessoas/par-relacionado usa roxo
  revisao: { label: 'Aguardando par', cls: 'text-rival-ink bg-rival-soft' },
  // verde = concluído/meta
  concluida: { label: 'Concluída', cls: 'text-success-ink bg-success-soft' },
}

export function Badge({ status, children }: { status: Status; children?: string }) {
  const d = map[status]
  return (
    <span
      className={`inline-flex items-center rounded-lg px-[10px] py-[5px] text-[11.5px] font-extrabold ${d.cls}`}
    >
      {children ?? d.label}
    </span>
  )
}

/** Pontos ganhos — sempre verde (recompensa). Ex.: <Points value={10} /> → +10 pts */
export function Points({ value }: { value: number }) {
  return (
    <span className="rounded-lg bg-success-soft px-[10px] py-[5px] text-xs font-extrabold text-success-ink">
      +{value} pts
    </span>
  )
}
