// Properties
export const PROP_TITLE = 'title'
export const PROP_CORRESPONDING_AUTHOR = 'correspondingAuthor'
export const PROP_CONTRIBUTING_AUTHORS = 'contributingAuthors'
export const PROP_COLLABORATIONS = 'collaborations'
export const PROP_GENERAL_INFO = 'generalInfo'
export const PROP_AUTHOR_INFO = 'authorInfo'
export const PROP_OBSERVATION_INFO = 'observationInfo'
export const PROP_TOPIC = 'topic'
export const PROP_OBJECT_NAME = 'objectName'
export const PROP_ABSTRACT = 'abstract'
export const PROP_ACKNOWLEDGEMENTS = 'acknowledgements'
export const PROP_PREVIOUS_RAFTS = 'relatedPublishedRafts'
export const PROP_FIGURE = 'figure'

// Author Properties
export const PROP_AUTHOR_FIRST_NAME = 'firstName'
export const PROP_AUTHOR_LAST_NAME = 'lastName'
export const PROP_AUTHOR_ORCID = 'authorORCID'
export const PROP_AUTHOR_AFFILIATION = 'affiliation'
export const PROP_AUTHOR_EMAIL = 'email'

// Machine Readable Table Properties
export const PROP_TECHNICAL_INFO = 'technical'
export const PROP_MPC_ID = 'mpcId'
export const PROP_ALERT_ID = 'alertId'
export const PROP_INSTRUMENT = 'instrument'
export const PROP_MJD = 'mjd'
export const PROP_TIME_OBSERVED = 'timeObserved'
export const PROP_TELESCOPE = 'telescope'

// Measurement Properties
export const PROP_MEASUREMENT_INFO = 'measurementInfo'
export const PROP_POSITION = 'position'
export const PROP_FLUX = 'flux'
export const PROP_PHOTOMETRY = 'photometry'
export const PROP_WAVELENGTH = 'wavelength'
export const PROP_BRIGHTNESS = 'brightness'
export const PROP_ERRORS = 'errors'

// Optional Properties
export const PROP_EPHEMERIS = 'ephemeris'
export const PROP_ORBITAL_ELEMENTS = 'orbitalElements'
export const PROP_SPECTROSCOPY = 'spectroscopy'
export const PROP_ASTROMETRY = 'astrometry'
export const PROP_MISC_INFO = 'miscInfo'
export const PROP_MISC = 'misc'
export const PROP_MISC_KEY = 'miscKey'
export const PROP_MISC_VALUE = 'miscValue'

// Review
export const PROP_STATUS = 'status'
export const PROP_POST_OPT_OUT = 'postOptOut'
export const OPTION_DRAFT = 'draft'
export const OPTION_REVIEW = 'review_ready'
export const OPTION_UNDER_REVIEW = 'under_review'
export const OPTION_APPROVED = 'approved'
export const OPTION_REJECTED = 'rejected'
export const OPTION_PUBLISHED = 'published'
// Backend status values (DOI backend uses different naming)
export const OPTION_IN_PROGRESS = 'in progress' // backend's draft status
export const OPTION_IN_REVIEW = 'in review' // backend's review status
export const OPTION_MINTED = 'minted' // backend's published status
export const STATUS_OPTIONS = [
  OPTION_DRAFT,
  OPTION_REVIEW,
  OPTION_UNDER_REVIEW,
  OPTION_APPROVED,
  OPTION_REJECTED,
  OPTION_PUBLISHED,
  // Backend status values
  OPTION_IN_PROGRESS,
  OPTION_IN_REVIEW,
  OPTION_MINTED,
] as const
// Topic Options
export const OPTION_COMET = 'comet'
export const OPTION_NEA = 'near_earth_asteroid'
export const OPTION_TNO = 'trans_neptunian_object'
export const OPTION_ASTEROID = 'asteroid'
export const OPTION_PHA = 'potentially_hazardous_asteroid'
export const OPTION_ISO = 'interstellar_object'
export const OPTION_TCEO = 'temporarily_captured_earth_orbiter'
export const OPTION_ACTIVE = 'active_object'
export const OPTION_OUTBURST = 'outburst'
export const OPTION_MULTI_COMPONENT = 'multi_component_system'
export const OPTION_UNUSUAL_ROTATION = 'unusual_rotation_properties'
export const OPTION_UNUSUAL_SPECTRA = 'unusual_colour_spectra'
export const OPTION_NON_DETECTION = 'non_detection'
export const OPTION_NON_GRAVITATIONAL = 'non_gravitational_perturbations'
export const OPTION_ERRATA = 'errata'
export const OPTION_RETRACTION = 'retraction'
export const OPTION_OTHER = 'other'

export const TOPIC_OPTIONS = [
  OPTION_COMET,
  OPTION_NEA,
  OPTION_TNO,
  OPTION_ASTEROID,
  OPTION_PHA,
  OPTION_ISO,
  OPTION_TCEO,
  OPTION_ACTIVE,
  OPTION_OUTBURST,
  OPTION_MULTI_COMPONENT,
  OPTION_UNUSUAL_ROTATION,
  OPTION_UNUSUAL_SPECTRA,
  OPTION_NON_DETECTION,
  OPTION_NON_GRAVITATIONAL,
  OPTION_ERRATA,
  OPTION_RETRACTION,
  OPTION_OTHER,
] as const

export const FORM_SECTIONS = [
  PROP_AUTHOR_INFO,
  PROP_OBSERVATION_INFO,
  PROP_TECHNICAL_INFO,
  PROP_MISC_INFO,
] as const
// Brightness Unit Options
export const OPTION_BRIGHTNESS_AB_MAG = 'AB mag'
export const OPTION_BRIGHTNESS_VEGA_MAG = 'Vega mag'
export const OPTION_BRIGHTNESS_MJY = 'mJy'
export const OPTION_BRIGHTNESS_ERGS = 'ergs/s/cm^2/Å'

export const ORCID_REGEX = /^(\d{4}-){3}\d{3}[\dX]$/

// User
export const ROLE_REVIEWER = 'reviewer'
export const ROLE_CONTRIBUTOR = 'contributor'
export const USER_ROLES = [ROLE_REVIEWER, ROLE_CONTRIBUTOR] as const
