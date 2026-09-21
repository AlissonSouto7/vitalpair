import { screen } from '@testing-library/react'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'

import type { Draft } from './draft'
import { MealEditor } from './MealEditor'

import { i18n, renderWithProviders } from '@/test/render'
import type { MealType } from '@/types/nutrition'

const MEALS: MealType[] = ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK']
/**
 * Atalho para as chaves deste namespace.
 *
 * `as never` na chave: o i18n do projeto é tipado com a união de todas as chaves, o que é
 * ótimo no código de produção e impossível de satisfazer com uma string montada num teste.
 * O risco de digitar errado fica coberto pelo próprio teste, que falha se a tradução não
 * existir.
 */
const n = (k: string, v?: Record<string, unknown>) => i18n.t(`nutrition.${k}` as never, v ?? {})

function pao(over: Partial<Draft> = {}): Draft {
  return {
    name: 'Pão francês',
    barcode: null,
    kcalPer100: '300',
    proteinPer100: '9.4',
    carbPer100: '58.6',
    fatPer100: '3.1',
    grams: '100',
    mealType: 'BREAKFAST',
    isPrivate: false,
    source: 'OPEN_FOOD_FACTS',
    ...over,
  }
}

/**
 * Um invólucro que é dono do rascunho, como a página real: o editor recebe `draft` e
 * `setDraft`, então testá-lo com um rascunho fixo esconderia justamente o recálculo.
 */
function mount(inicial: Draft, onSave = vi.fn()) {
  function Harness() {
    const [draft, setDraft] = useState(inicial)
    const factor = (Number(draft.grams) || 0) / 100
    const round = (v: number) => Math.round(v * 10) / 10
    return (
      <MealEditor
        t={i18n.t}
        draft={draft}
        setDraft={setDraft}
        computed={{
          calories: round(Number(draft.kcalPer100 || 0) * factor),
          protein: round(Number(draft.proteinPer100 || 0) * factor),
          carb: round(Number(draft.carbPer100 || 0) * factor),
          fat: round(Number(draft.fatPer100 || 0) * factor),
        }}
        foodNameId="food"
        mealLabel={(m) => i18n.t(`nutrition.mealShort.${m}`)}
        mealValues={MEALS}
        onSave={onSave}
        onDiscard={vi.fn()}
        saving={false}
      />
    )
  }
  return { onSave, ...renderWithProviders(<Harness />) }
}

/**
 * Registrar uma refeição, uma pergunta por vez.
 *
 * O editor não tinha nenhum teste, sendo a parte mais usada do app. Estes cobrem o fluxo
 * que substituiu os cinco campos numéricos por 100g depois de a tela ter sido chamada de
 * "extremamente horrível" no primeiro teste com usuária real.
 */
describe('MealEditor', () => {
  it('pergunta a refeição antes de perguntar a quantidade', () => {
    mount(pao())

    expect(screen.getByText(n('whichMealQuestion'))).toBeInTheDocument()
    // A quantidade ainda não está na tela: uma pergunta por vez é o ponto.
    expect(screen.queryByText(n('howMuchQuestion'))).not.toBeInTheDocument()
  })

  it('vai para a quantidade assim que a refeição é escolhida', async () => {
    const { user } = mount(pao())

    await user.click(screen.getByRole('button', { name: n('mealShort.LUNCH') }))

    expect(screen.getByText(n('howMuchQuestion'))).toBeInTheDocument()
  })

  it('oferece porções em linguagem de gente, não gramas', async () => {
    const { user } = mount(pao())
    await user.click(screen.getByRole('button', { name: n('mealShort.BREAKFAST') }))

    // "1 unidade", não "digite as gramas": ninguém come 100 gramas de pão.
    expect(screen.getByRole('button', { name: /1 unidade/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /2 unidades/ })).toBeInTheDocument()
  })

  it('recalcula o total quando a porção muda', async () => {
    const { user } = mount(pao())
    await user.click(screen.getByRole('button', { name: n('mealShort.BREAKFAST') }))

    // 100g a 300 kcal/100g
    expect(screen.getByText('300 kcal')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /1 unidade/ }))

    // 50g é metade
    expect(screen.getByText('150 kcal')).toBeInTheDocument()
  })

  it('mantém o caminho de digitar os números', async () => {
    const { user } = mount(pao())
    await user.click(screen.getByRole('button', { name: n('mealShort.BREAKFAST') }))

    // O ajuste manual é o que salva quem sabe exatamente o que comeu. Escondê-lo para
    // simplificar deixaria essa pessoa sem saída, e foi a primeira coisa cobrada quando o
    // fluxo foi apresentado sem ele.
    await user.click(screen.getByText(n('tweakNumbers')))

    const kcal = screen.getByLabelText(n('kcalField'))
    await user.clear(kcal)
    await user.type(kcal, '250')

    expect(screen.getByText('250 kcal')).toBeInTheDocument()
  })

  it('salva com a refeição escolhida no primeiro passo', async () => {
    const { user, onSave } = mount(pao())

    await user.click(screen.getByRole('button', { name: n('mealShort.DINNER') }))
    await user.click(
      screen.getByRole('button', { name: n('registerIn', { meal: n('mealShort.DINNER') }) }),
    )

    expect(onSave).toHaveBeenCalledOnce()
  })

  it('deixa voltar para trocar a refeição', async () => {
    const { user } = mount(pao())

    await user.click(screen.getByRole('button', { name: n('mealShort.LUNCH') }))
    await user.click(screen.getByRole('button', { name: i18n.t('common.back') }))

    expect(screen.getByText(n('whichMealQuestion'))).toBeInTheDocument()
  })

  it('não deixa salvar um alimento sem calorias', async () => {
    const { user } = mount(pao({ kcalPer100: '' }))
    await user.click(screen.getByRole('button', { name: n('mealShort.BREAKFAST') }))

    // "Não sei" e "zero" são afirmações diferentes, e só a pessoa sabe qual é a verdadeira.
    expect(
      screen.getByRole('button', { name: n('registerIn', { meal: n('mealShort.BREAKFAST') }) }),
    ).toBeDisabled()
  })

  it('começa pelo nome quando a pessoa está registrando à mão', () => {
    mount(pao({ name: '', source: 'MANUAL', kcalPer100: '' }))

    // Perguntar "quanto?" antes de saber o que é seria absurdo, então o registro manual
    // abre direto no formulário, com o ajuste já aberto.
    expect(screen.getByLabelText(n('whatLabel'))).toBeInTheDocument()
    expect(screen.queryByText(n('whichMealQuestion'))).not.toBeInTheDocument()
  })
})
