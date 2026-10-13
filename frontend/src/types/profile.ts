export type Sex = 'MALE' | 'FEMALE' | 'OTHER'
export type Goal = 'LOSE_WEIGHT' | 'GAIN_MUSCLE' | 'MAINTAIN' | 'IMPROVE_FITNESS'
export type ActivityLevel = 'SEDENTARY' | 'LIGHT' | 'MODERATE' | 'ACTIVE' | 'VERY_ACTIVE'

export interface UserProfile {
  id: string
  email: string
  emailVerified: boolean
  name: string
  birthDate: string | null
  sex: Sex | null
  heightCm: number | null
  weightKg: number | null
  /**
   * Quanto a pessoa quer chegar a pesar.
   *
   * Nulo é um estado legítimo: quem escolheu manter o peso não tem alvo, e quem não quis
   * dizer também não. A tela mostra a barra de progresso quando existe e oferece defini-lo
   * quando não existe, em vez de inventar um a partir de IMC.
   */
  targetWeightKg: number | null
  goal: Goal | null
  activityLevel: ActivityLevel | null
  dailyCalorieTarget: number | null
  proteinTargetG: number | null
  carbTargetG: number | null
  fatTargetG: number | null
  avatarUrl: string | null
  /** Aparência escolhida para o mascote, ou null enquanto a pessoa não escolheu. */
  mascot: 'SPROUT' | 'BLOSSOM' | null
  /** IANA identifier, e.g. "America/Sao_Paulo". Decides where this user's day starts. */
  timeZone: string
  createdAt: string
  updatedAt: string
}

export interface UpdateProfilePayload {
  name: string
  birthDate: string
  sex: Sex
  heightCm: number
  weightKg: number
  /** Opcional: quem escolheu manter o peso não tem alvo. Omitir deixa o guardado como está. */
  targetWeightKg?: number | null
  goal: Goal
  activityLevel: ActivityLevel
  avatarUrl?: string | null
  /** Omitted leaves the stored zone alone; the server never clears it. */
  timeZone?: string
}

export interface Tdee {
  bmr: number
  tdee: number
  dailyCalorieTarget: number
  proteinTargetG: number
  carbTargetG: number
  fatTargetG: number
}
