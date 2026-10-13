import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { GoalProgress } from './GoalProgress'

import { renderWithProviders } from '@/test/render'
import type { Level } from '@/types/gamification'

/**
 * A barra do objetivo, que é o que o painel não tinha.
 *
 * A tela falava só de hoje: quanto a pessoa comeu, quanto faltava para a meta do dia, a missão
 * da vez. Seis dias de uso, com peso caindo e sequência de seis, e nada dizia que ela estava
 * progredindo.
 *
 * O que estes testes protegem: que a barra mede o objetivo e não o tempo, que ela não mente
 * quando o peso vai para o lado errado, e que quem não tem alvo continua vendo uma tela útil.
 */
const nivel: Level = { level: 3, points: 470, pointsToNext: 330, percent: 64 }

function barra() {
  return screen.getByRole('progressbar')
}

describe('GoalProgress', () => {
  it('measures the distance walked towards the goal, not the time passed', () => {
    renderWithProviders(
      <GoalProgress
        goal="LOSE_WEIGHT"
        startWeightKg={62}
        currentWeightKg={60.5}
        targetWeightKg={58}
        level={nivel}
        streakDays={6}
      />,
    )

    // 1,5 kg de 4: 37,5, arredondado para 38.
    expect(barra()).toHaveAttribute('aria-valuenow', '38')
    expect(screen.getByText(/62,0 → 58,0 kg/)).toBeInTheDocument()
    expect(screen.getByText(/1,5 de 4,0 kg/)).toBeInTheDocument()
    expect(screen.getByText(/faltam 2,5 kg/)).toBeInTheDocument()
  })

  it('works the same way for somebody gaining weight', () => {
    renderWithProviders(
      <GoalProgress
        goal="GAIN_MUSCLE"
        startWeightKg={70}
        currentWeightKg={72}
        targetWeightKg={78}
        level={nivel}
        streakDays={0}
      />,
    )

    // 2 kg de 8.
    expect(barra()).toHaveAttribute('aria-valuenow', '25')
  })

  it('does not claim progress when the weight went the other way', () => {
    renderWithProviders(
      <GoalProgress
        goal="LOSE_WEIGHT"
        startWeightKg={62}
        currentWeightKg={63.5}
        targetWeightKg={58}
        level={nivel}
        streakDays={0}
      />,
    )

    /*
     * Quem engordou 1,5 kg querendo emagrecer não andou 1,5 kg do caminho. A barra mostra
     * progresso, e o retrocesso já está no número do peso logo acima dela: pintar a barra
     * seria o produto parabenizando pelo contrário do que ela pediu.
     */
    expect(barra()).toHaveAttribute('aria-valuenow', '0')
    expect(screen.getByText(/faltam 5,5 kg/)).toBeInTheDocument()
  })

  it('says so when the goal is reached, instead of stopping at 99%', () => {
    renderWithProviders(
      <GoalProgress
        goal="LOSE_WEIGHT"
        startWeightKg={62}
        currentWeightKg={57.4}
        targetWeightKg={58}
        level={nivel}
        streakDays={3}
      />,
    )

    expect(barra()).toHaveAttribute('aria-valuenow', '100')
    expect(screen.getByText(/chegou na sua meta/i)).toBeInTheDocument()
  })

  it('offers to set a target instead of hiding the card from somebody who has none', () => {
    renderWithProviders(
      <GoalProgress
        goal="LOSE_WEIGHT"
        startWeightKg={62}
        currentWeightKg={62}
        targetWeightKg={null}
        level={nivel}
        streakDays={0}
      />,
    )

    // Quem não sabe que pode definir um alvo nunca vai procurar onde.
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: /definir um peso de meta/i })).toBeInTheDocument()
  })

  it('does not ask for a target weight from somebody who is not chasing one', () => {
    renderWithProviders(
      <GoalProgress
        goal="MAINTAIN"
        startWeightKg={62}
        currentWeightKg={62}
        targetWeightKg={null}
        level={nivel}
        streakDays={0}
      />,
    )

    // "Manter o peso" não tem alvo: perguntar seria uma pergunta que nunca foi feita.
    expect(screen.queryByRole('link', { name: /definir um peso de meta/i })).not.toBeInTheDocument()
    expect(screen.getByText(/470 pontos até agora/i)).toBeInTheDocument()
  })

  it('shows the level and the streak as badges, each saying a different thing', () => {
    renderWithProviders(
      <GoalProgress
        goal="LOSE_WEIGHT"
        startWeightKg={62}
        currentWeightKg={60.5}
        targetWeightKg={58}
        level={nivel}
        streakDays={6}
      />,
    )

    /*
     * Três informações que não competem: a barra é o objetivo (onde ela quer chegar), o nível
     * é o esforço acumulado (o que já fez) e a chama é a constância (o que não quer quebrar).
     */
    expect(screen.getByRole('link', { name: /nível 3/i })).toBeInTheDocument()
    expect(screen.getByText('6')).toBeInTheDocument()
  })

  it('hides the streak badge when there is no streak to show', () => {
    renderWithProviders(
      <GoalProgress
        goal="LOSE_WEIGHT"
        startWeightKg={62}
        currentWeightKg={60.5}
        targetWeightKg={58}
        level={nivel}
        streakDays={0}
      />,
    )

    // Uma chama apagada com um zero ao lado anuncia o fracasso do dia anterior.
    expect(screen.queryByText('0')).not.toBeInTheDocument()
  })
})
