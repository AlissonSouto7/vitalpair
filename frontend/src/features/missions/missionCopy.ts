import type { TFunction } from 'i18next'

import type { FlashMission, WeeklyMission } from '@/types/missions'

/**
 * O título e a linha de apoio de uma missão, no idioma da interface.
 *
 * O catálogo vive no banco (migrations V13 e V15) com o texto gravado em pt-BR, então uma
 * tela em inglês mostrava "Registre 3 refeições hoje", e a missão é o conteúdo principal
 * dessa tela, não um rótulo de canto. O `code` é estável e já servia de chave de lista, o
 * que permite traduzir no cliente sem migração e sem invalidar missão já aceita.
 *
 * O `defaultValue` é o texto do próprio servidor: missão que ele criar antes deste bundle
 * aparece em português, em vez de mostrar a chave crua para o usuário.
 */
interface Copy {
  title: string
  description: string | null
}

function translate(code: string, title: string, support: string | null, t: TFunction): Copy {
  return {
    title: t(`missions.mission.${code}.title`, { defaultValue: title }),
    description: support
      ? t(`missions.mission.${code}.description`, { defaultValue: support })
      : null,
  }
}

/**
 * A relâmpago guarda a linha de apoio em `description` e a semanal em `subtitle`, porque
 * são duas tabelas com nomes de coluna diferentes (V13 e V15). Em vez de um helper que
 * tenta as duas e adivinha, cada tipo tem a sua função: o campo certo fica dito no nome,
 * e o compilador recusa quem passar a missão errada.
 */
export function flashCopy(mission: FlashMission, t: TFunction): Copy {
  return translate(mission.code, mission.title, mission.description, t)
}

export function weeklyCopy(mission: WeeklyMission, t: TFunction): Copy {
  return translate(mission.code, mission.title, mission.subtitle, t)
}
