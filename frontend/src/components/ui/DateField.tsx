import { useTranslation } from 'react-i18next'

/**
 * Uma data, no seletor que o próprio aparelho oferece.
 *
 * Eram três dropdowns feitos à mão (dia, mês, ano). Medido num iPhone de 390px: a lista
 * abre com `max-h-60` (240px) e cada opção tem 36px, então **cabem 6 por vez**. Para achar
 * 1998 na lista de 120 anos era preciso rolar até a 29ª posição, ou seja **1044px de
 * rolagem dentro de um popup de 240px**, com o dedo, para informar a data de nascimento.
 * No cadastro, antes de a pessoa ter visto qualquer valor do produto.
 *
 * `type="date"` entrega isso ao sistema: no celular abre a roleta nativa, no computador o
 * calendário do navegador, e quem usa leitor de tela ganha um controle que ele já sabe
 * narrar. O formato mostrado é o do idioma do aparelho; o valor continua sendo ISO
 * `yyyy-mm-dd`, que é o que a API espera, então nada muda para quem chama.
 *
 * `max` é hoje: uma data de nascimento no futuro não existe, e o navegador recusa antes de
 * o formulário precisar dizer isso. Não há `min`, porque o backend valida apenas `@Past` e
 * inventar uma idade mínima aqui seria uma regra que o produto não tem.
 */
export function DateField({
  id,
  labelId,
  value,
  onChange,
  'aria-describedby': describedBy,
  'aria-invalid': invalid,
}: {
  id?: string
  /** O id do elemento cujo texto nomeia este campo. */
  labelId?: string
  value: string
  onChange: (iso: string) => void
  'aria-describedby'?: string
  'aria-invalid'?: boolean
}) {
  const { t } = useTranslation()
  const hoje = new Date().toISOString().slice(0, 10)

  return (
    <input
      id={id}
      type="date"
      className="input"
      value={value}
      max={hoje}
      onChange={(e) => onChange(e.target.value)}
      aria-labelledby={labelId}
      aria-describedby={describedBy}
      aria-invalid={invalid}
      // Safari no iOS não mostra placeholder em input[type=date]; o rótulo acima é quem
      // nomeia o campo, e o aria-label cobre o caso de ele ser lido isolado.
      aria-label={labelId ? undefined : t('common.date.birthDate')}
    />
  )
}
