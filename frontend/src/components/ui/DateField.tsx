import { Select } from './Select'

const MONTHS = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
]

/**
 * Seletor de data de nascimento: três dropdowns estilizados (dia / mês / ano),
 * sem o calendário nativo do navegador e sem deixar escolher datas no futuro.
 * value/onChange usam ISO 'yyyy-mm-dd' (ou '' enquanto estiver incompleto).
 */
export function DateField({ value, onChange }: { value: string; onChange: (iso: string) => void }) {
  const [y = '', m = '', d = ''] = value ? value.split('-') : []
  const thisYear = new Date().getFullYear()

  const dayOpts = Array.from({ length: 31 }, (_, i) => {
    const dd = String(i + 1).padStart(2, '0')
    return { value: dd, label: String(i + 1) }
  })
  const monthOpts = MONTHS.map((label, i) => ({ value: String(i + 1).padStart(2, '0'), label }))
  // de 13 anos atrás até 100 anos antes disso — faixa razoável para data de nascimento
  const yearOpts = Array.from({ length: 100 }, (_, i) => {
    const yy = String(thisYear - 13 - i)
    return { value: yy, label: yy }
  })

  function emit(nd: string, nm: string, ny: string) {
    onChange(nd && nm && ny ? `${ny}-${nm}-${nd}` : '')
  }

  return (
    <div className="grid grid-cols-[1fr_1.4fr_1fr] gap-2">
      <Select value={d} onChange={(nd) => emit(nd, m, y)} options={dayOpts} placeholder="Dia" />
      <Select value={m} onChange={(nm) => emit(d, nm, y)} options={monthOpts} placeholder="Mês" />
      <Select value={y} onChange={(ny) => emit(d, m, ny)} options={yearOpts} placeholder="Ano" />
    </div>
  )
}
