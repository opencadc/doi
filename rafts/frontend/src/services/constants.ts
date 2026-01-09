/**
 * Module for interacting with the CANFAR storage service
 */

// Base URL for CANFAR storage vault API
// Configurable via environment variables for local development
// Default: CANFAR production storage
// Local dev: https://haproxy.cadc.dao.nrc.ca/cavern/files
export const CANFAR_STORAGE_BASE_URL =
  process.env.NEXT_CANFAR_STORAGE_BASE_URL || 'https://www.canfar.net/storage/vault/file'
export const VAULT_BASE_ENDPOINT =
  process.env.NEXT_VAULT_BASE_ENDPOINT || 'https://ws-cadc.canfar.net/vault/files'
// Synctrans endpoint for file uploads (PUT)
export const VAULT_SYNCTRANS_ENDPOINT =
  process.env.NEXT_VAULT_SYNCTRANS_ENDPOINT || 'https://ws-cadc.canfar.net/vault/synctrans'
export const DEFAULT_RAFT_NAME = 'RAFT.json'
// VOSpace authority for constructing vos:// URIs
export const VOSPACE_AUTHORITY = process.env.NEXT_VOSPACE_AUTHORITY || 'cadc.nrc.ca~vault'
// https://ws-cadc.canfar.net/vault/files/AstroDataCitationDOI/CISTI.CANFAR/25.0047/data/5397631_7799701.pdf
// partial url - configurable for local development (e.g., 'rafts-test')
export const CITE_ULR = process.env.NEXT_CITE_URL || 'AstroDataCitationDOI/CISTI.CANFAR'
