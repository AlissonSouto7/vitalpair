import { z } from 'zod'

import { GOAL_VALUES, LEVEL_VALUES, profileSchema } from '../profile/profileForm'

/**
 * What the first two steps collect, which is the whole profile the server needs before it
 * can compute a target: step 1 is the person, step 2 how active their days are.
 *
 * One schema for both steps because they are sent in one request when step 2 is left.
 * Checking a step on its own is a matter of which fields `trigger` is asked about, not of
 * two schemas that could disagree with each other. Built on the profile's own schema
 * rather than restating its bounds, for the same reason.
 */
export const onboardingSchema = profileSchema
  .extend({
    goal: z.enum(GOAL_VALUES),
    activityLevel: z.enum(LEVEL_VALUES),
  })
  /*
   * O alvo de peso tem de concordar com o objetivo.
   *
   * Quem quer perder e digita um alvo maior que o peso de hoje provavelmente trocou os números
   * de lugar. O servidor também recusa; este é o mesmo aviso chegando antes da viagem de ida e
   * volta. Sem alvo não há o que checar, porque o campo é opcional de propósito: quem escolheu
   * manter o peso não tem alvo.
   *
   * Aqui e não no esquema do perfil porque é aqui que o objetivo existe: sem ele, a regra não
   * tem como ser escrita.
   */
  .superRefine((valores, ctx) => {
    const problema = targetWeightProblem(valores)
    if (problema) {
      ctx.addIssue({ code: 'custom', path: ['targetWeightKg'], message: problema })
    }
  })

/**
 * O que há de errado com o alvo de peso, ou nulo quando não há nada.
 *
 * Uma função, e não só o refinamento do esquema, porque o passo 1 precisa dela antes de o
 * formulário inteiro ser válido: o zod só executa refinamentos de objeto depois que todos os
 * campos passam, e no passo 1 a rotina ainda não foi respondida. Medido: um alvo de 90 kg para
 * quem pesa 78 e quer emagrecer atravessava o passo sem aviso e só era recusado pelo servidor,
 * duas telas depois.
 */
export function targetWeightProblem(valores: {
  targetWeightKg?: number | null
  weightKg?: number | null
  goal?: string | null
}): 'targetAboveCurrent' | 'targetBelowCurrent' | null {
  const { targetWeightKg: alvo, weightKg: atual, goal: objetivo } = valores
  if (alvo == null || atual == null) return null
  if (objetivo === 'LOSE_WEIGHT' && alvo >= atual) return 'targetAboveCurrent'
  if (objetivo === 'GAIN_MUSCLE' && alvo <= atual) return 'targetBelowCurrent'
  return null
}

export type OnboardingValues = z.infer<typeof onboardingSchema>

/** The fields step 1 owns, so the page can validate that step before the routine exists. */
export const ABOUT_YOU_FIELDS = [
  'name',
  'weightKg',
  'heightCm',
  'birthDate',
  'sex',
  'goal',
  'targetWeightKg',
] as const satisfies readonly (keyof OnboardingValues)[]
