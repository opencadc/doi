import {
  FORM_SECTIONS,
  PROP_AUTHOR_AFFILIATION,
  PROP_AUTHOR_EMAIL,
  PROP_AUTHOR_FIRST_NAME,
  PROP_AUTHOR_INFO,
  PROP_AUTHOR_LAST_NAME,
  PROP_AUTHOR_ORCID,
  PROP_GENERAL_INFO,
  PROP_MEASUREMENT_INFO,
  PROP_MISC_INFO,
  PROP_OBSERVATION_INFO,
  PROP_TECHNICAL_INFO,
} from '@/shared/constants'

export const EMPTY_AUTHOR = {
  [PROP_AUTHOR_FIRST_NAME]: '',
  [PROP_AUTHOR_LAST_NAME]: '',
  [PROP_AUTHOR_ORCID]: '',
  [PROP_AUTHOR_AFFILIATION]: '',
  [PROP_AUTHOR_EMAIL]: '',
}

export const FINAL_REVIEW_STEP = FORM_SECTIONS.length

export const REVIEW_SECTION = 'review_section'

export const FORM_INFO = {
  [PROP_AUTHOR_INFO]: {
    messages: ['author_form_message_one', 'author_form_message_two'],
  },
  [PROP_OBSERVATION_INFO]: {
    messages: [],
  },
  [PROP_MISC_INFO]: {
    messages: ['misc_form_message_one'],
  },
  [PROP_TECHNICAL_INFO]: {
    messages: ['announcement_form_message_one'],
  },
  [PROP_MEASUREMENT_INFO]: {
    messages: [],
  },
  [PROP_GENERAL_INFO]: {
    messages: [],
  },
  [REVIEW_SECTION]: {
    messages: ['review_form_message_one'],
  },
} as const
