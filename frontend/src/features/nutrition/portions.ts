import type { TFunction } from 'i18next'

/**
 * As porções que a tela oferece, em vez de pedir gramas.
 *
 * Ninguém come "100 gramas de pão": come um pão, meio pão, dois pães. Pedir gramas obriga a
 * pessoa a converter de cabeça o que ela já sabe em linguagem comum, e foi parte do motivo
 * de a tela ter sido descrita como "extremamente horrível" no primeiro teste com usuária real.
 *
 * O peso de cada porção é um palpite razoável, não um dado nutricional: serve para ser o
 * ponto de partida. Quem quiser o número exato abre "ajustar" e digita, que é o caminho que
 * continua existindo lado a lado.
 */

/**
 * As chaves possíveis, escritas por extenso.
 *
 * Uma união e não `string`: o i18n deste projeto é tipado, então declarar assim faz o
 * compilador recusar uma porção cuja tradução não exista, em vez de a tela mostrar a chave
 * crua na frente da pessoa.
 */
export type PortionKey =
  | 'halfUnit'
  | 'unit'
  | 'twoUnits'
  | 'spoon'
  | 'plateHalf'
  | 'plateFull'
  | 'glassSmall'
  | 'glass'
  | 'bottle'
  | 'smallPiece'
  | 'piece'
  | 'bigPiece'
  | 'littleBit'
  | 'normal'
  | 'lots'

export interface Portion {
  key: PortionKey
  grams: number
}

/**
 * Famílias de alimento reconhecidas pelo nome.
 *
 * Casar por texto é grosseiro e assumidamente provisório: o certo é o próprio catálogo
 * dizer suas porções, o que depende de um campo que a Open Food Facts nem sempre traz. Até
 * lá, isto acerta os casos que aparecem no café da manhã brasileiro e cai num padrão
 * honesto quando não reconhece.
 */
const FAMILIES: { match: RegExp; portions: Portion[] }[] = [
  {
    // pão francês, pão de forma, pão de queijo
    match: /\bp[ãa]o\b|\bbread\b/i,
    portions: [
      { key: 'halfUnit', grams: 25 },
      { key: 'unit', grams: 50 },
      { key: 'twoUnits', grams: 100 },
    ],
  },
  {
    match: /\b(arroz|feij[ãa]o|macarr[ãa]o|massa|pur[êe]|rice|pasta|beans)\b/i,
    portions: [
      { key: 'spoon', grams: 45 },
      { key: 'plateHalf', grams: 100 },
      { key: 'plateFull', grams: 200 },
    ],
  },
  {
    match: /\b(leite|suco|caf[ée]|ch[áa]|[áa]gua|refrigerante|milk|juice|coffee|tea)\b/i,
    portions: [
      { key: 'glassSmall', grams: 150 },
      { key: 'glass', grams: 250 },
      { key: 'bottle', grams: 500 },
    ],
  },
  {
    match: /\b(banana|ma[çc][ãa]|laranja|mam[ãa]o|manga|pera|uva|apple|orange)\b/i,
    portions: [
      { key: 'halfUnit', grams: 60 },
      { key: 'unit', grams: 120 },
      { key: 'twoUnits', grams: 240 },
    ],
  },
  {
    match: /\b(frango|carne|b[ií]fe|peixe|ovo|chicken|beef|fish|egg)\b/i,
    portions: [
      { key: 'smallPiece', grams: 60 },
      { key: 'piece', grams: 120 },
      { key: 'bigPiece', grams: 200 },
    ],
  },
]

/** O padrão para o que não foi reconhecido: frações de 100g, que é a base do catálogo. */
const DEFAULT_PORTIONS: Portion[] = [
  { key: 'littleBit', grams: 50 },
  { key: 'normal', grams: 100 },
  { key: 'lots', grams: 200 },
]

export function portionsFor(foodName: string): Portion[] {
  const found = FAMILIES.find((f) => f.match.test(foodName))
  return found ? found.portions : DEFAULT_PORTIONS
}

/**
 * O nome da porção no idioma de quem lê.
 *
 * Um mapa explícito em vez de montar a chave com interpolação: o i18n é tipado, e uma chave
 * construída em tempo de execução escapa dessa checagem. Assim, apagar uma tradução quebra
 * a compilação em vez de aparecer como texto solto na tela.
 */
export function portionLabel(t: TFunction, key: PortionKey): string {
  const map: Record<PortionKey, string> = {
    halfUnit: t('nutrition.portions.halfUnit'),
    unit: t('nutrition.portions.unit'),
    twoUnits: t('nutrition.portions.twoUnits'),
    spoon: t('nutrition.portions.spoon'),
    plateHalf: t('nutrition.portions.plateHalf'),
    plateFull: t('nutrition.portions.plateFull'),
    glassSmall: t('nutrition.portions.glassSmall'),
    glass: t('nutrition.portions.glass'),
    bottle: t('nutrition.portions.bottle'),
    smallPiece: t('nutrition.portions.smallPiece'),
    piece: t('nutrition.portions.piece'),
    bigPiece: t('nutrition.portions.bigPiece'),
    littleBit: t('nutrition.portions.littleBit'),
    normal: t('nutrition.portions.normal'),
    lots: t('nutrition.portions.lots'),
  }
  return map[key]
}
