export const AUTH_FAILED = '401'
export const CANFAR_LOGIN_URL =
  process.env.NEXT_PUBLIC_CANFAR_LOGIN_URL || 'https://ws-cadc.canfar.net/ac/login'
export const CANFAR_USERS_URL =
  process.env.NEXT_PUBLIC_CANFAR_USERS_URL || 'https://ws-cadc.canfar.net/ac/users'
export const CANFAR_USER_URL =
  process.env.NEXT_CANFAR_AC_WHOAMI_URL || 'https://ws-cadc.canfar.net/ac/whoami'
export const CANFAR_USER_GROUPS_URL =
  process.env.NEXT_CANFAR_AC_SEARCH_URL || 'https://ws-cadc.canfar.net/ac/search'
export const CANFAR_RAFT_REVIEWER_GROUP =
  process.env.NEXT_CANFAR_RAFT_GROUP_NAME || 'RAFTS-reviewers'
export const CANFAR_COOKIE_DOMAIN_URL =
  process.env.NEXT_CANFAR_COOKIE_URL || 'https://www.canfar.net/access/sso?cookieValue='
export const CADC_COOKIE_DOMAIN_URL =
  process.env.NEXT_CADC_COOKIE_URL ||
  'https://www.cadc-ccda.hia-iha.nrc-cnrc.gc.ca/access/sso?cookieValue='
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000'
