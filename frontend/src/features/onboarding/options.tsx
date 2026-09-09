import type { TFunction } from 'i18next'
import type { ReactNode } from 'react'

import { IconDown, IconEqual, IconMuscle, IconSpark } from './icons'
import type { GoalTone } from './StepParts'

import type { ActivityLevel, Goal, Sex } from '@/types/profile'

/**
 * The choices each onboarding step offers, built from the translations.
 *
 * Functions rather than constants because the labels come from i18n and have to be read
 * after the language is known. Apart from the page because they are data, not flow: nothing
 * here touches the state the five steps share.
 */

export const buildStepLabels = (t: TFunction) => [
  t('onboarding.stepYou'),
  t('onboarding.stepRoutine'),
  t('onboarding.stepGoal'),
  t('onboarding.stepPartner'),
  t('onboarding.stepBet'),
]

export const buildSexOptions = (t: TFunction): { value: Sex; label: string }[] => [
  { value: 'MALE', label: t('onboarding.sexMale') },
  { value: 'FEMALE', label: t('onboarding.sexFemale') },
  { value: 'OTHER', label: t('onboarding.sexOther') },
]

export const buildGoalOptions = (
  t: TFunction,
): { value: Goal; label: string; hint: string; icon: ReactNode; tone: GoalTone }[] => [
  {
    value: 'LOSE_WEIGHT',
    label: t('onboarding.goalLoseLabel'),
    hint: t('onboarding.goalLoseHint'),
    icon: <IconDown className="h-5 w-5" />,
    tone: 'brand',
  },
  {
    value: 'GAIN_MUSCLE',
    label: t('onboarding.goalGainLabel'),
    hint: t('onboarding.goalGainHint'),
    icon: <IconMuscle className="h-5 w-5" />,
    tone: 'rival',
  },
  {
    value: 'MAINTAIN',
    label: t('onboarding.goalMaintainLabel'),
    hint: t('onboarding.goalMaintainHint'),
    icon: <IconEqual className="h-5 w-5" />,
    tone: 'success',
  },
  {
    value: 'IMPROVE_FITNESS',
    label: t('onboarding.goalFitnessLabel'),
    hint: t('onboarding.goalFitnessHint'),
    icon: <IconSpark className="h-5 w-5" />,
    tone: 'carb',
  },
]

export const buildActivityOptions = (
  t: TFunction,
): { value: ActivityLevel; label: string; hint: string }[] => [
  {
    value: 'SEDENTARY',
    label: t('onboarding.actSedentaryLabel'),
    hint: t('onboarding.actSedentaryHint'),
  },
  { value: 'LIGHT', label: t('onboarding.actLightLabel'), hint: t('onboarding.actLightHint') },
  {
    value: 'MODERATE',
    label: t('onboarding.actModerateLabel'),
    hint: t('onboarding.actModerateHint'),
  },
  { value: 'ACTIVE', label: t('onboarding.actActiveLabel'), hint: t('onboarding.actActiveHint') },
  {
    value: 'VERY_ACTIVE',
    label: t('onboarding.actVeryActiveLabel'),
    hint: t('onboarding.actVeryActiveHint'),
  },
]
