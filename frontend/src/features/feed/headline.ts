import type { TFunction } from 'i18next'

import type { FeedItem } from '@/types/feed'

/**
 * O título de um item do mural, escrito aqui e não lido do banco.
 *
 * O servidor guardava a frase pronta, em português, então o mural ficava em português com a
 * interface em inglês e trocar de idioma não mudava nada. Ele também juntava as partes com um
 * travessão, que as regras de escrita do projeto proíbem; o separador é o `·` que o resto do
 * aplicativo usa.
 *
 * Itens guardados antes dessa mudança não têm os campos estruturados e caem na frase antiga,
 * o que mantém murais velhos inteiros em vez de esvaziá-los.
 *
 * <p>Vive num módulo próprio porque a tela do mural e o resumo do painel mostram a mesma
 * linha. O resumo lia `item.title` direto, que é o campo legado: medido em 28/09/2026, quatro
 * refeições recém-registradas apareciam no painel sem nome nenhum, enquanto a API devolvia
 * "Arroz branco cozido" e "Feijão carioca cozido" corretamente.
 */
export function feedHeadline(item: FeedItem, t: TFunction): string {
  if (item.type === 'MEAL_LOGGED' && item.foodName) {
    const meal = item.mealType ? t(`feed.mealType.${item.mealType}`) : null
    return meal ? `${item.foodName} (${meal})` : item.foodName
  }
  if (item.type === 'ACTIVITY_LOGGED' && item.activityType) {
    const kind = t(`feed.activityType.${item.activityType}`)
    return item.calories != null ? `${kind} · ${t('feed.kcal', { n: item.calories })}` : kind
  }
  return item.title ?? ''
}
