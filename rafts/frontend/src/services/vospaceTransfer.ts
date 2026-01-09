/**
 * VOSpace Transfer Utilities
 *
 * Shared server-side utilities for uploading files to VOSpace using
 * the VOSpace Transfer API (UWS job pattern).
 *
 * This module is server-side only - do not import from client components.
 */

import { VAULT_SYNCTRANS_ENDPOINT, VOSPACE_AUTHORITY } from '@/services/constants'

// VOSpace nodes endpoint for creating/managing nodes
const VAULT_NODES_ENDPOINT =
  process.env.NEXT_VAULT_NODES_ENDPOINT || 'https://ws-cadc.canfar.net/vault/nodes'

// ============================================================================
// XML Builders
// ============================================================================

/**
 * Build a VOSpace transfer XML document for pushing a file
 */
export function buildTransferXml(vosPath: string): string {
  const vosUri = `vos://${VOSPACE_AUTHORITY}/${vosPath}`
  return `<?xml version="1.0" encoding="UTF-8"?>
<vos:transfer xmlns:vos="http://www.ivoa.net/xml/VOSpace/v2.0" version="2.1">
  <vos:target>${vosUri}</vos:target>
  <vos:direction>pushToVoSpace</vos:direction>
  <vos:protocol uri="ivo://ivoa.net/vospace/core#httpsput"/>
</vos:transfer>`
}

/**
 * Build VOSpace DataNode XML for creating a file node
 */
export function buildDataNodeXml(vosPath: string): string {
  const vosUri = `vos://${VOSPACE_AUTHORITY}/${vosPath}`
  return `<?xml version="1.0" encoding="UTF-8"?>
<vos:node xmlns:vos="http://www.ivoa.net/xml/VOSpace/v2.0"
          xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
          xsi:type="vos:DataNode"
          uri="${vosUri}">
</vos:node>`
}

/**
 * Build ContainerNode XML for creating a folder
 */
export function buildContainerNodeXml(vosPath: string): string {
  const vosUri = `vos://${VOSPACE_AUTHORITY}/${vosPath}`
  return `<?xml version="1.0" encoding="UTF-8"?>
<vos:node xmlns:vos="http://www.ivoa.net/xml/VOSpace/v2.0"
          xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
          xsi:type="vos:ContainerNode"
          uri="${vosUri}">
</vos:node>`
}

// ============================================================================
// XML Parsers
// ============================================================================

/**
 * Parse UWS job XML to extract phase and transferDetails URL
 */
export function parseUwsJobXml(xml: string): {
  phase: string
  transferDetailsUrl: string | null
  error: string | null
} {
  const phaseMatch = xml.match(/<uws:phase>([^<]+)<\/uws:phase>/)
  const phase = phaseMatch ? phaseMatch[1] : 'UNKNOWN'

  const transferDetailsMatch = xml.match(/id="transferDetails"[^>]*xlink:href="([^"]+)"/)
  const transferDetailsUrl = transferDetailsMatch ? transferDetailsMatch[1] : null

  const errorMatch = xml.match(/<uws:message>([^<]+)<\/uws:message>/)
  const error = errorMatch ? errorMatch[1] : null

  return { phase, transferDetailsUrl, error }
}

/**
 * Parse VOSpace transfer XML to extract the actual upload endpoint
 */
export function parseTransferDetailsXml(xml: string): string | null {
  const endpointMatch = xml.match(/<vos:endpoint>([^<]+)<\/vos:endpoint>/)
  return endpointMatch ? endpointMatch[1] : null
}

// ============================================================================
// Node Management
// ============================================================================

/**
 * Ensure a ContainerNode (folder) exists in VOSpace
 */
export async function ensureContainerNodeExists(
  vosPath: string,
  accessToken: string,
): Promise<{ exists: boolean; created: boolean }> {
  const nodeUrl = `${VAULT_NODES_ENDPOINT}/${vosPath}`
  const authHeaders = { Cookie: `CADC_SSO=${accessToken}` }

  console.log('[ensureContainerNodeExists] Checking:', nodeUrl)

  // Check if node exists
  const getResponse = await fetch(nodeUrl, {
    method: 'GET',
    headers: { ...authHeaders, Accept: 'text/xml' },
  })

  if (getResponse.ok) {
    console.log('[ensureContainerNodeExists] Already exists')
    return { exists: true, created: false }
  }

  // Create the container node
  console.log('[ensureContainerNodeExists] Creating...')
  const nodeXml = buildContainerNodeXml(vosPath)
  const createResponse = await fetch(nodeUrl, {
    method: 'PUT',
    headers: { ...authHeaders, 'Content-Type': 'text/xml' },
    body: nodeXml,
  })

  console.log('[ensureContainerNodeExists] Create response:', createResponse.status)

  if (createResponse.ok || createResponse.status === 201) {
    return { exists: true, created: true }
  }

  if (createResponse.status === 409) {
    // Conflict - already exists
    return { exists: true, created: false }
  }

  return { exists: false, created: false }
}

/**
 * Ensure a DataNode (file placeholder) exists in VOSpace
 */
export async function ensureDataNodeExists(
  vosPath: string,
  accessToken: string,
): Promise<{ exists: boolean; created: boolean }> {
  const nodeUrl = `${VAULT_NODES_ENDPOINT}/${vosPath}`
  const authHeaders = { Cookie: `CADC_SSO=${accessToken}` }

  console.log('[ensureDataNodeExists] Checking:', nodeUrl)

  // Check if node exists
  const getResponse = await fetch(nodeUrl, {
    method: 'GET',
    headers: { ...authHeaders, Accept: 'text/xml' },
  })

  if (getResponse.ok) {
    console.log('[ensureDataNodeExists] Already exists')
    return { exists: true, created: false }
  }

  // Create the data node
  console.log('[ensureDataNodeExists] Creating...')
  const nodeXml = buildDataNodeXml(vosPath)
  const createResponse = await fetch(nodeUrl, {
    method: 'PUT',
    headers: { ...authHeaders, 'Content-Type': 'text/xml' },
    body: nodeXml,
  })

  console.log('[ensureDataNodeExists] Create response:', createResponse.status)

  if (createResponse.ok || createResponse.status === 201) {
    return { exists: true, created: true }
  }

  if (createResponse.status === 409) {
    return { exists: true, created: false }
  }

  return { exists: false, created: false }
}

// ============================================================================
// Transfer Negotiation
// ============================================================================

/**
 * Negotiate a VOSpace transfer to get the actual upload endpoint
 * Uses UWS (Universal Worker Service) job pattern
 */
export async function negotiateTransfer(vosPath: string, accessToken: string): Promise<string> {
  const transferXml = buildTransferXml(vosPath)
  const authHeaders = { Cookie: `CADC_SSO=${accessToken}` }

  console.log('[negotiateTransfer] POSTing to synctrans for path:', vosPath)

  // Step 1: POST transfer request to synctrans
  const synctransResponse = await fetch(VAULT_SYNCTRANS_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'text/xml', ...authHeaders },
    body: transferXml,
    redirect: 'manual',
  })

  console.log('[negotiateTransfer] synctrans response:', synctransResponse.status)

  if (synctransResponse.status !== 303) {
    const errorText = await synctransResponse.text().catch(() => '')
    throw new Error(`Expected 303 redirect, got ${synctransResponse.status}: ${errorText}`)
  }

  const locationUrl = synctransResponse.headers.get('Location')
  if (!locationUrl) {
    throw new Error('No Location header in synctrans response')
  }

  // Step 2: GET the job XML
  const jobUrl = locationUrl.replace('/results/transferDetails', '')
  console.log('[negotiateTransfer] Getting job:', jobUrl)

  const jobResponse = await fetch(jobUrl, {
    method: 'GET',
    headers: { ...authHeaders, Accept: 'text/xml' },
  })

  if (!jobResponse.ok) {
    const errorText = await jobResponse.text().catch(() => '')
    throw new Error(`Failed to get transfer job: ${jobResponse.status}: ${errorText}`)
  }

  const jobXml = await jobResponse.text()
  const { phase, transferDetailsUrl, error } = parseUwsJobXml(jobXml)

  if (phase === 'ERROR') {
    throw new Error(`Transfer job failed: ${error || 'Unknown error'}`)
  }

  if (!transferDetailsUrl) {
    throw new Error('No transferDetails URL in job response')
  }

  // Step 3: GET the transfer details
  console.log('[negotiateTransfer] Getting transfer details')
  const transferDetailsResponse = await fetch(transferDetailsUrl, {
    method: 'GET',
    headers: { ...authHeaders, Accept: 'text/xml' },
  })

  if (!transferDetailsResponse.ok) {
    const errorText = await transferDetailsResponse.text().catch(() => '')
    throw new Error(
      `Failed to get transfer details: ${transferDetailsResponse.status}: ${errorText}`,
    )
  }

  const transferDetailsXml = await transferDetailsResponse.text()
  const uploadEndpoint = parseTransferDetailsXml(transferDetailsXml)

  if (!uploadEndpoint) {
    throw new Error('No endpoint URL in transfer details')
  }

  console.log('[negotiateTransfer] Got upload endpoint')
  return uploadEndpoint
}

// ============================================================================
// High-Level Upload Functions
// ============================================================================

export interface UploadResult {
  success: boolean
  error?: string
}

/**
 * Upload content to VOSpace
 *
 * @param vosPath - Full VOSpace path (e.g., "rafts-test/RAFTS-xxx/data/file.txt")
 * @param content - Content to upload (string or Buffer)
 * @param mimeType - MIME type of the content
 * @param accessToken - CADC SSO access token
 */
export async function uploadToVOSpace(
  vosPath: string,
  content: string | Buffer,
  mimeType: string,
  accessToken: string,
): Promise<UploadResult> {
  try {
    console.log('[uploadToVOSpace] Starting upload for:', vosPath)

    // Step 1: Ensure DataNode exists
    await ensureDataNodeExists(vosPath, accessToken)

    // Step 2: Negotiate transfer
    const uploadEndpoint = await negotiateTransfer(vosPath, accessToken)

    // Step 3: PUT the content
    console.log('[uploadToVOSpace] PUTting content')
    const response = await fetch(uploadEndpoint, {
      method: 'PUT',
      headers: {
        Cookie: `CADC_SSO=${accessToken}`,
        'Content-Type': mimeType,
      },
      body: content,
    })

    console.log('[uploadToVOSpace] PUT response:', response.status)

    if (!response.ok) {
      const errorText = await response.text().catch(() => '')
      return { success: false, error: `Upload failed: ${response.status} ${errorText}` }
    }

    return { success: true }
  } catch (error) {
    console.error('[uploadToVOSpace] Exception:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Upload content to a folder in VOSpace (ensures folder exists first)
 *
 * @param folderPath - VOSpace folder path (e.g., "rafts-test/RAFTS-xxx/data/attachments")
 * @param filename - Filename to upload as
 * @param content - Content to upload
 * @param mimeType - MIME type
 * @param accessToken - CADC SSO access token
 */
export async function uploadToVOSpaceFolder(
  folderPath: string,
  filename: string,
  content: string | Buffer,
  mimeType: string,
  accessToken: string,
): Promise<UploadResult> {
  try {
    // Ensure the folder exists
    await ensureContainerNodeExists(folderPath, accessToken)

    // Upload the file
    const filePath = `${folderPath}/${filename}`
    return await uploadToVOSpace(filePath, content, mimeType, accessToken)
  } catch (error) {
    console.error('[uploadToVOSpaceFolder] Exception:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
