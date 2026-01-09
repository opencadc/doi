// DOI service URL - configurable via environment variable for local development
// Default: CANFAR production DOI service
// Local dev: https://haproxy.cadc.dao.nrc.ca/doi/instances
export const SUBMIT_DOI_URL =
  process.env.NEXT_DOI_BASE_URL || 'https://ws-cadc.canfar.net/doi/instances'

export const MESSAGE = 'message'
export const SUCCESS = 'success'
export const DATA = 'data'
