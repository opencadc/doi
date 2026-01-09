// model.ts
import { z } from 'zod'
import {
  OPTION_DRAFT,
  ORCID_REGEX,
  PROP_ABSTRACT,
  PROP_ACKNOWLEDGEMENTS,
  PROP_ALERT_ID,
  PROP_ASTROMETRY,
  PROP_AUTHOR_AFFILIATION,
  PROP_AUTHOR_EMAIL,
  PROP_AUTHOR_FIRST_NAME,
  PROP_AUTHOR_INFO,
  PROP_AUTHOR_LAST_NAME,
  PROP_AUTHOR_ORCID,
  PROP_BRIGHTNESS,
  PROP_CONTRIBUTING_AUTHORS,
  PROP_COLLABORATIONS,
  PROP_CORRESPONDING_AUTHOR,
  PROP_EPHEMERIS,
  PROP_ERRORS,
  PROP_FIGURE,
  PROP_FLUX,
  PROP_GENERAL_INFO,
  PROP_MEASUREMENT_INFO,
  PROP_MISC,
  PROP_MISC_INFO,
  PROP_MISC_KEY,
  PROP_MISC_VALUE,
  PROP_MJD,
  PROP_MPC_ID,
  PROP_OBJECT_NAME,
  PROP_OBSERVATION_INFO,
  PROP_ORBITAL_ELEMENTS,
  PROP_PHOTOMETRY,
  PROP_POSITION,
  PROP_POST_OPT_OUT,
  PROP_PREVIOUS_RAFTS,
  PROP_SPECTROSCOPY,
  PROP_TECHNICAL_INFO,
  PROP_TELESCOPE,
  PROP_TIME_OBSERVED,
  PROP_TITLE,
  PROP_TOPIC,
  PROP_WAVELENGTH,
  PROP_STATUS,
  ROLE_CONTRIBUTOR,
  STATUS_OPTIONS,
  TOPIC_OPTIONS,
  USER_ROLES,
} from './constants'

export const miscInfoSchema = z.object({
  [PROP_MISC]: z
    .array(
      z.object({
        [PROP_MISC_KEY]: z.string().optional(),
        [PROP_MISC_VALUE]: z.string().optional(),
      }),
    )
    .optional(),
})

const spectroscopySchema = z
  .object({
    [PROP_WAVELENGTH]: z.string(),
    [PROP_FLUX]: z.string().optional(),
    [PROP_ERRORS]: z.string().optional(),
  })
  .optional()

const astrometrySchema = z
  .object({
    [PROP_POSITION]: z.string().optional(),
    [PROP_TIME_OBSERVED]: z.string().optional(),
  })
  .optional()

const photometrySchema = z
  .object({
    [PROP_WAVELENGTH]: z.string().optional(),
    [PROP_BRIGHTNESS]: z.string().optional(),
    [PROP_ERRORS]: z.string().optional(),
  })
  .optional()

export const measurementInfoSchema = z.object({
  [PROP_PHOTOMETRY]: photometrySchema,
  [PROP_SPECTROSCOPY]: spectroscopySchema,
  [PROP_ASTROMETRY]: astrometrySchema,
})

export const pearsonSchema = z.object({
  [PROP_AUTHOR_FIRST_NAME]: z.string().min(1, { message: 'is_required' }),
  [PROP_AUTHOR_LAST_NAME]: z.string().min(1, { message: 'is_required' }),
  [PROP_AUTHOR_AFFILIATION]: z.string().min(1, { message: 'is_required' }),
  [PROP_AUTHOR_ORCID]: z
    .string()
    .trim()
    .optional()
    .refine((val) => !val || ORCID_REGEX.test(val), { message: 'invalid_orcid' }),
  [PROP_AUTHOR_EMAIL]: z.string().email({ message: 'valid_email_required' }),
})

export const technicalInfoSchema = z
  .object({
    [PROP_PHOTOMETRY]: photometrySchema,
    [PROP_SPECTROSCOPY]: z.string().optional(),
    [PROP_ASTROMETRY]: z.string().optional(),
    [PROP_EPHEMERIS]: z.string().optional(),
    [PROP_ORBITAL_ELEMENTS]: z.string().optional(),
    [PROP_MPC_ID]: z.string().optional(),
    [PROP_ALERT_ID]: z.string().optional(),
    [PROP_MJD]: z
      .string()
      .refine((val) => !val || /^\d{5}(\.\d+)?$/.test(val), { message: 'invalid_mjd_format' }),
    [PROP_TELESCOPE]: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    // Check if at least one identifier is provided
    if (!data[PROP_MPC_ID] && !data[PROP_ORBITAL_ELEMENTS]) {
      // Add error for each field
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'at_least_one_identifier_required',
        path: [PROP_MPC_ID],
      })
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'at_least_one_identifier_required',
        path: [PROP_ORBITAL_ELEMENTS],
      })
    }
  })

export const generalSchema = z.object({
  [PROP_TITLE]: z.string().min(1, { message: 'is_required' }),
  [PROP_POST_OPT_OUT]: z.boolean().default(false),
  [PROP_STATUS]: z.enum(STATUS_OPTIONS).default(OPTION_DRAFT),
})

export const authorSchema = z.object({
  [PROP_CORRESPONDING_AUTHOR]: pearsonSchema,
  [PROP_CONTRIBUTING_AUTHORS]: z.array(pearsonSchema).optional(),
  [PROP_COLLABORATIONS]: z.array(z.string()).optional(),
})

export const observationSchema = z.object({
  [PROP_TOPIC]: z
    .array(z.enum(TOPIC_OPTIONS))
    .min(1, { message: 'is_required' })
    .nonempty({ message: 'is_required' }),
  [PROP_OBJECT_NAME]: z.string({ message: 'is_required' }),
  [PROP_ABSTRACT]: z.string().min(1, { message: 'is_required' }).max(2000, {
    message: 'character_limit',
  }),
  [PROP_FIGURE]: z.string().optional(),
  [PROP_ACKNOWLEDGEMENTS]: z.string().optional(),
  [PROP_PREVIOUS_RAFTS]: z.string().optional(),
})

export const raftSchema = z.object({
  [PROP_GENERAL_INFO]: generalSchema,
  [PROP_AUTHOR_INFO]: authorSchema,
  [PROP_OBSERVATION_INFO]: observationSchema,
  [PROP_TECHNICAL_INFO]: technicalInfoSchema,
  [PROP_MEASUREMENT_INFO]: measurementInfoSchema,
  [PROP_MISC_INFO]: miscInfoSchema,
})

// Export types
export type TRaftSubmission = z.infer<typeof raftSchema>
export type TAuthor = z.infer<typeof authorSchema>
export type TGeneral = z.infer<typeof generalSchema>
export type TPerson = z.infer<typeof pearsonSchema>
export type TObservation = z.infer<typeof observationSchema>
export type TTechInfo = z.infer<typeof technicalInfoSchema>
export type TMeasurementInfo = z.infer<typeof measurementInfoSchema>
export type TSpectroscopy = z.infer<typeof spectroscopySchema>
export type TPhotometry = z.infer<typeof photometrySchema>
export type TAstrometry = z.infer<typeof astrometrySchema>
export type TMiscInfo = z.infer<typeof miscInfoSchema>
export type TMeasurement = TSpectroscopy | TPhotometry | TAstrometry
export type TSection = TGeneral | TAuthor | TObservation | TTechInfo | TMeasurementInfo | TMiscInfo
export type TRaftStatus = (typeof STATUS_OPTIONS)[number]

// user model
export const userRolesSchema = z.object({
  role: z.enum(USER_ROLES).default(ROLE_CONTRIBUTOR),
})
export type TUserRole = z.infer<typeof userRolesSchema>
export type TRoles = (typeof USER_ROLES)[number]
