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
    category: 'BREAD',
    daysAgo: 0,
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

  it('cada porção já mostra quanto custa, antes do toque', async () => {
    const { user } = mount(pao())
    await user.click(screen.getByRole('button', { name: n('mealShort.BREAKFAST') }))

    /*
     * O botão dizia só o peso, e a caloria daquela escolha aparecia embaixo depois do toque.
     * Para comparar meio pão com dois pães a pessoa tocava, olhava para baixo, voltava e tocava
     * no outro. Quem escolhe a porção está decidindo quanto vai comer, e é a caloria que
     * responde isso.
     */
    expect(screen.getByRole('button', { name: /1 unidade/ })).toHaveTextContent('150 kcal')
    expect(screen.getByRole('button', { name: /2 unidades/ })).toHaveTextContent('300 kcal')
    expect(screen.getByRole('button', { name: /1 unidade/ })).toHaveTextContent('50 g')
  })

  it('não inventa caloria para o alimento que não tem informação nutricional', async () => {
    const { user } = mount(pao({ kcalPer100: '' }))
    await user.click(screen.getByRole('button', { name: n('mealShort.BREAKFAST') }))

    // "0 kcal" no botão afirmaria que a porção não tem caloria nenhuma, que é diferente de
    // "ninguém sabe quantas". O peso continua, porque esse é conhecido.
    const botao = screen.getByRole('button', { name: /1 unidade/ })
    expect(botao).not.toHaveTextContent('kcal')
    expect(botao).toHaveTextContent('50 g')
  })

  it('deixa dizer que a refeição foi de ontem', async () => {
    const { user } = mount(pao())
    await user.click(screen.getByRole('button', { name: n('mealShort.BREAKFAST') }))

    /*
     * Quem esquecia de registrar o jantar e abria o aplicativo na manhã seguinte não tinha como
     * dizer: a refeição entrava como comida hoje, e a sequência, o placar e a competição da
     * semana são contados por data. O caminho existia na API desde sempre e nenhuma tela o
     * alcançava.
     */
    const ontem = screen.getByRole('button', { name: n('day.yesterday') })
    expect(screen.getByRole('button', { name: n('day.today') })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(ontem).toHaveAttribute('aria-pressed', 'false')

    await user.click(ontem)

    expect(ontem).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: n('day.today') })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
  })

  it('recalcula o total quando a porção muda', async () => {
    const { user } = mount(pao())
    await user.click(screen.getByRole('button', { name: n('mealShort.BREAKFAST') }))

    /*
     * Pelo papel e não pelo texto: desde que cada botão de porção mostra a própria caloria,
     * "300 kcal" aparece no botão da porção de 100g e no total, e um `getByText` casava com os
     * dois. O total é o que vai para o diário, então é ele que este teste tem de olhar.
     */
    // 100g a 300 kcal/100g
    expect(screen.getByRole('status')).toHaveTextContent('300 kcal')

    await user.click(screen.getByRole('button', { name: /1 unidade/ }))

    // 50g é metade
    expect(screen.getByRole('status')).toHaveTextContent('150 kcal')
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

    expect(screen.getByRole('status')).toHaveTextContent('250 kcal')
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
