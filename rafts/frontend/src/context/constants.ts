import {
  PROP_AUTHOR_INFO,
  PROP_GENERAL_INFO,
  PROP_MEASUREMENT_INFO,
  PROP_MISC_INFO,
  PROP_OBSERVATION_INFO,
  PROP_TECHNICAL_INFO,
} from '@/shared/constants'
import {
  authorSchema,
  generalSchema,
  measurementInfoSchema,
  miscInfoSchema,
  observationSchema,
  technicalInfoSchema,
} from '@/shared/model'

export const IS_COMPLETED = 'is_completed'

export const VALIDATION_SCHEMAS = {
  [PROP_GENERAL_INFO]: generalSchema,
  [PROP_AUTHOR_INFO]: authorSchema,
  [PROP_OBSERVATION_INFO]: observationSchema,
  [PROP_TECHNICAL_INFO]: technicalInfoSchema,
  [PROP_MEASUREMENT_INFO]: measurementInfoSchema,
  [PROP_MISC_INFO]: miscInfoSchema,
} as const
