import { queryOptions } from '@tanstack/react-query'

import {
  getBadgeCatalog,
  getBadges,
  getCompetition,
  getLevel,
  getStreaks,
} from '@/api/gamification'

/**
 * What the achievements screen reads.
 *
 * Three calls that used to be one effect with a Promise.all: any one of them failing took
 * the whole screen down, and none of them was cached, so leaving and coming back fetched
 * all three again. As separate queries the badge catalogue is shared with anything else
 * that needs it, and a failure is per-call rather than all-or-nothing.
 */
export const gamificationQueries = {
  streaks: () =>
    queryOptions({
      queryKey: ['gamification', 'streaks'],
      queryFn: getStreaks,
    }),

  /** O nível, somado do histórico inteiro de pontos no servidor. */
  level: () =>
    queryOptions({
      queryKey: ['gamification', 'level'],
      queryFn: getLevel,
    }),

  /**
   * O placar da semana e as semanas já fechadas.
   *
   * A mesma chave que o painel usa, porque é a mesma resposta: duas telas lendo o mesmo
   * endereço devem compartilhar uma resposta em cache, e não buscar cada uma a sua.
   */
  competition: () =>
    queryOptions({
      queryKey: ['gamification', 'competition'],
      queryFn: getCompetition,
    }),

  earned: () =>
    queryOptions({
      queryKey: ['gamification', 'badges'],
      queryFn: getBadges,
    }),

  /**
   * Every badge that exists, earned or not.
   *
   * The catalogue only changes when the product ships a new badge, so it is worth keeping
   * for the session rather than refetching on every visit.
   */
  catalog: () =>
    queryOptions({
      queryKey: ['gamification', 'catalog'],
      queryFn: getBadgeCatalog,
      staleTime: Infinity,
    }),
}
