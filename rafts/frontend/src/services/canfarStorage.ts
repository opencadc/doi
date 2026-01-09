import {
  DEFAULT_RAFT_NAME,
  VAULT_BASE_ENDPOINT,
  VAULT_SYNCTRANS_ENDPOINT,
  VOSPACE_AUTHORITY,
} from '@/services/constants'

// VOSpace nodes endpoint for creating/managing nodes
const VAULT_NODES_ENDPOINT =
  process.env.NEXT_VAULT_NODES_ENDPOINT || 'https://ws-cadc.canfar.net/vault/nodes'
import { StorageResponse } from '@/services/types'
import { getCurrentPath } from '@/services/utils'
import { TRaftContext } from '@/context/types'
import { IResponseData } from '@/actions/types'

/**
 * Build a VOSpace transfer XML document for pushing a file
 * @param vosPath - The VOSpace path (e.g., rafts-test/RAFTS-xxx/data/RAFT.json)
 * @returns XML string for the transfer request
 */
function buildTransferXml(vosPath: string): string {
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
function buildDataNodeXml(vosPath: string): string {
  const vosUri = `vos://${VOSPACE_AUTHORITY}/${vosPath}`
  return `<?xml version="1.0" encoding="UTF-8"?>
<vos:node xmlns:vos="http://www.ivoa.net/xml/VOSpace/v2.0"
          xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
          xsi:type="vos:DataNode"
          uri="${vosUri}">
</vos:node>`
}

/**
 * Create or update a DataNode in VOSpace
 * This is required before uploading file content
 */
async function ensureDataNodeExists(
  vosPath: string,
  accessToken: string,
): Promise<{ exists: boolean; created: boolean }> {
  const nodeUrl = `${VAULT_NODES_ENDPOINT}/${vosPath}`
  console.log('[ensureDataNodeExists] Checking/creating node at:', nodeUrl)

  const authHeaders = {
    Cookie: `CADC_SSO=${accessToken}`,
  }

  // First, check if node already exists
  const getResponse = await fetch(nodeUrl, {
    method: 'GET',
    headers: {
      ...authHeaders,
      Accept: 'text/xml',
    },
  })

  if (getResponse.ok) {
    console.log('[ensureDataNodeExists] Node already exists')
    return { exists: true, created: false }
  }

  if (getResponse.status !== 404) {
    const errorText = await getResponse.text().catch(() => '')
    console.log('[ensureDataNodeExists] Unexpected response:', getResponse.status, errorText)
    // Continue to try creating the node anyway
  }

  // Node doesn't exist, create it
  console.log('[ensureDataNodeExists] Node not found, creating...')
  const nodeXml = buildDataNodeXml(vosPath)
  console.log('[ensureDataNodeExists] Node XML:', nodeXml)

  const createResponse = await fetch(nodeUrl, {
    method: 'PUT',
    headers: {
      ...authHeaders,
      'Content-Type': 'text/xml',
    },
    body: nodeXml,
  })

  console.log('[ensureDataNodeExists] Create response:', createResponse.status)

  if (createResponse.ok || createResponse.status === 201) {
    console.log('[ensureDataNodeExists] Node created successfully')
    return { exists: true, created: true }
  }

  // Node might already exist (409 Conflict) or parent doesn't exist (404)
  const errorText = await createResponse.text().catch(() => '')
  console.log('[ensureDataNodeExists] Create failed:', createResponse.status, errorText)

  // If 409 conflict, node already exists
  if (createResponse.status === 409) {
    return { exists: true, created: false }
  }

  // Return what we have - transfer might still work
  return { exists: false, created: false }
}

/**
 * Parse UWS job XML to extract phase and transferDetails URL
 */
function parseUwsJobXml(xml: string): {
  phase: string
  transferDetailsUrl: string | null
  error: string | null
} {
  // Extract phase
  const phaseMatch = xml.match(/<uws:phase>([^<]+)<\/uws:phase>/)
  const phase = phaseMatch ? phaseMatch[1] : 'UNKNOWN'

  // Extract transferDetails URL from results (id="transferDetails")
  const transferDetailsMatch = xml.match(/id="transferDetails"[^>]*xlink:href="([^"]+)"/)
  const transferDetailsUrl = transferDetailsMatch ? transferDetailsMatch[1] : null

  // Extract error message if present
  const errorMatch = xml.match(/<uws:message>([^<]+)<\/uws:message>/)
  const error = errorMatch ? errorMatch[1] : null

  return { phase, transferDetailsUrl, error }
}

/**
 * Parse VOSpace transfer XML to extract the actual upload endpoint
 */
function parseTransferDetailsXml(xml: string): string | null {
  // Look for endpoint inside protocol element
  // <vos:protocol uri="..."><vos:endpoint>URL</vos:endpoint></vos:protocol>
  const endpointMatch = xml.match(/<vos:endpoint>([^<]+)<\/vos:endpoint>/)
  return endpointMatch ? endpointMatch[1] : null
}

/**
 * Negotiate a VOSpace transfer to get the actual upload endpoint
 * Uses UWS (Universal Worker Service) job pattern
 */
async function negotiateTransfer(transferXml: string, accessToken: string): Promise<string> {
  console.log('[negotiateTransfer] POSTing to synctrans:', VAULT_SYNCTRANS_ENDPOINT)

  // Use Cookie auth (CADC_SSO) for consistency with DOI API
  const authHeaders = {
    Cookie: `CADC_SSO=${accessToken}`,
  }

  // Step 1: POST transfer request to synctrans - don't follow redirects
  const synctransResponse = await fetch(VAULT_SYNCTRANS_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/xml',
      ...authHeaders,
    },
    body: transferXml,
    redirect: 'manual', // Don't follow redirects automatically
  })

  console.log('[negotiateTransfer] synctrans response:', synctransResponse.status)

  // Expect 303 redirect with Location header
  if (synctransResponse.status !== 303) {
    const errorText = await synctransResponse.text().catch(() => '')
    throw new Error(
      `Expected 303 redirect from synctrans, got ${synctransResponse.status}: ${errorText}`,
    )
  }

  // Get the transfer job URL from Location header (strip /results/transferDetails)
  const locationUrl = synctransResponse.headers.get('Location')
  if (!locationUrl) {
    throw new Error('No Location header in synctrans response')
  }
  console.log('[negotiateTransfer] Location URL:', locationUrl)

  // Extract the job URL (without /results/transferDetails)
  const jobUrl = locationUrl.replace('/results/transferDetails', '')
  console.log('[negotiateTransfer] Job URL:', jobUrl)

  // Step 2: GET the job XML to check status
  const jobResponse = await fetch(jobUrl, {
    method: 'GET',
    headers: {
      ...authHeaders,
      Accept: 'text/xml',
    },
  })

  console.log('[negotiateTransfer] job response:', jobResponse.status)

  if (!jobResponse.ok) {
    const errorText = await jobResponse.text().catch(() => '')
    throw new Error(`Failed to get transfer job: ${jobResponse.status}: ${errorText}`)
  }

  const jobXml = await jobResponse.text()
  console.log('[negotiateTransfer] Job XML:', jobXml)

  // Parse the UWS job response
  const { phase, transferDetailsUrl, error } = parseUwsJobXml(jobXml)
  console.log(
    '[negotiateTransfer] Job phase:',
    phase,
    'transferDetailsUrl:',
    transferDetailsUrl,
    'error:',
    error,
  )

  if (phase === 'ERROR') {
    throw new Error(`Transfer job failed: ${error || 'Unknown error'}`)
  }

  if (!transferDetailsUrl) {
    throw new Error('No transferDetails URL in transfer job response')
  }

  // Step 3: GET the transferDetails URL to get the actual endpoint
  console.log('[negotiateTransfer] Getting transfer details from:', transferDetailsUrl)
  const transferDetailsResponse = await fetch(transferDetailsUrl, {
    method: 'GET',
    headers: {
      ...authHeaders,
      Accept: 'text/xml',
    },
  })

  console.log('[negotiateTransfer] transferDetails response:', transferDetailsResponse.status)

  if (!transferDetailsResponse.ok) {
    const errorText = await transferDetailsResponse.text().catch(() => '')
    throw new Error(
      `Failed to get transfer details: ${transferDetailsResponse.status}: ${errorText}`,
    )
  }

  const transferDetailsXml = await transferDetailsResponse.text()
  console.log('[negotiateTransfer] Transfer details XML:', transferDetailsXml)

  // Parse the actual upload endpoint from transfer details
  const uploadEndpoint = parseTransferDetailsXml(transferDetailsXml)
  console.log('[negotiateTransfer] Upload endpoint:', uploadEndpoint)

  if (!uploadEndpoint) {
    throw new Error('No endpoint URL in transfer details response')
  }

  return uploadEndpoint
}

export const uploadFile = async (
  doiIdentifier: string,
  fileJson: TRaftContext,
  accessToken: string,
): Promise<StorageResponse<{ uploaded: boolean }>> => {
  try {
    const currentPath = getCurrentPath(doiIdentifier)
    const filePath = `${currentPath}/${DEFAULT_RAFT_NAME}`

    console.log('[uploadFile] Starting VOSpace transfer for:', filePath)

    // Step 1: Ensure the DataNode exists (required before upload)
    const nodeResult = await ensureDataNodeExists(filePath, accessToken)
    console.log('[uploadFile] Node check result:', nodeResult)

    // Step 2: Build transfer XML and negotiate upload endpoint
    const transferXml = buildTransferXml(filePath)
    console.log('[uploadFile] Transfer XML:', transferXml)

    const uploadEndpoint = await negotiateTransfer(transferXml, accessToken)

    // Convert JSON to string for upload
    const jsonContent = JSON.stringify(fileJson, null, 2)

    // Step 3: PUT the file content to the negotiated endpoint
    console.log('[uploadFile] PUTting file to:', uploadEndpoint)
    const response = await fetch(uploadEndpoint, {
      method: 'PUT',
      headers: {
        Cookie: `CADC_SSO=${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: jsonContent,
    })
    console.log('[uploadFile] PUT response status:', response.status)

    if (!response.ok) {
      const errorText = (await response.text()) || 'Failed to upload file'
      console.error('[uploadFile] Error:', response.status, errorText)
      return {
        error: {
          status: response.status,
          message: errorText,
        },
      }
    }

    console.log('[uploadFile] Success - file uploaded via VOSpace Transfer API')
    return { data: { uploaded: true } }
  } catch (error) {
    console.error('[uploadFile] Exception:', error)
    return {
      error: {
        status: 500,
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      },
    }
  }
}

export const downloadRaftFile = async (
  dataDirectory: string,
  accessToken: string,
): Promise<IResponseData<TRaftContext>> => {
  try {
    // Remove leading slash from dataDirectory to avoid double slashes
    const cleanedDataDirectory = dataDirectory.startsWith('/')
      ? dataDirectory.slice(1)
      : dataDirectory
    const url = `${VAULT_BASE_ENDPOINT}/${cleanedDataDirectory}/${DEFAULT_RAFT_NAME}`

    console.log('[downloadRaftFile] Fetching from:', url)

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Cookie: `CADC_SSO=${accessToken}`,
      },
    })
    if (!response.ok) {
      const errorText = (await response.text()) || 'Failed to download a RAFT file'
      console.error('[downloadRaftFile] Error:', response.status, errorText)
      return {
        success: false,
        message: errorText,
      }
    }
    const data = await response.json()
    console.log('[downloadRaftFile] Success, data received')
    return { success: true, data }
  } catch (error) {
    console.error('[downloadRaftFile] Exception:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}
