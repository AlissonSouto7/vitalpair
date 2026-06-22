export function Bar({
  value,
  max,
  color = 'bg-lime-400',
}: {
  value: number
  max: number | null
  color?: string
}) {
  const pct = max && max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0
  return (
    <div className="h-2.5 w-full overflow-hidden rounded-full bg-surface2">
      <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
    </div>
  )
}
