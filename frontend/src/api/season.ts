import type { ApiResponse } from '../types/api'
import type { SeasonView } from '../types/season'

import { api } from './client'

export async function getSeason(): Promise<SeasonView> {
  const res = await api.get<ApiResponse<SeasonView>>('/season')
  return res.data.data
}

/**
 * Define o que o perdedor paga.
 *
 * O endpoint existe desde que a temporada subiu e nenhuma tela o chamava: a aposta aparecia
 * em dois cartões e ninguém conseguia mudá-la.
 */
export async function updateStake(stake: string): Promise<SeasonView> {
  const res = await api.put<ApiResponse<SeasonView>>('/season/stake', { stake })
  return res.data.data
}
