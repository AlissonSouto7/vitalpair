/** Pontos ganhos — sempre verde (recompensa). Ex.: <Points value={10} /> → +10 pts */
export function Points({ value }: { value: number }) {
  return (
    <span className="rounded-lg bg-success-soft px-[10px] py-[5px] text-xs font-extrabold text-success-ink">
      +{value} pts
    </span>
  )
}
