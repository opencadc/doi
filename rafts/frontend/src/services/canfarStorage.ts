/*
 ************************************************************************
 *******************  CANADIAN ASTRONOMY DATA CENTRE  *******************
 **************  CENTRE CANADIEN DE DONNÉES ASTRONOMIQUES  **************
 *
 *  (c) 2026.                            (c) 2026.
 *  Government of Canada                 Gouvernement du Canada
 *  National Research Council            Conseil national de recherches
 *  Ottawa, Canada, K1A 0R6              Ottawa, Canada, K1A 0R6
 *  All rights reserved                  Tous droits réservés
 *
 *  NRC disclaims any warranties,        Le CNRC dénie toute garantie
 *  expressed, implied, or               énoncée, implicite ou légale,
 *  statutory, of any kind with          de quelque nature que ce
 *  respect to the software,             soit, concernant le logiciel,
 *  including without limitation         y compris sans restriction
 *  any warranty of merchantability      toute garantie de valeur
 *  or fitness for a particular          marchande ou de pertinence
 *  purpose. NRC shall not be            pour un usage particulier.
 *  liable in any event for any          Le CNRC ne pourra en aucun cas
 *  damages, whether direct or           être tenu responsable de tout
 *  indirect, special or general,        dommage, direct ou indirect,
 *  consequential or incidental,         particulier ou général,
 *  arising from the use of the          accessoire ou fortuit, résultant
 *  software.  Neither the name          de l'utilisation du logiciel. Ni
 *  of the National Research             le nom du Conseil National de
 *  Council of Canada nor the            Recherches du Canada ni les noms
 *  names of its contributors may        de ses  participants ne peuvent
 *  be used to endorse or promote        être utilisés pour approuver ou
 *  products derived from this           promouvoir les produits dérivés
 *  software without specific prior      de ce logiciel sans autorisation
 *  written permission.                  préalable et particulière
 *                                       par écrit.
 *
 *  This file is part of the             Ce fichier fait partie du projet
 *  OpenCADC project.                    OpenCADC.
 *
 *  OpenCADC is free software:           OpenCADC est un logiciel libre ;
 *  you can redistribute it and/or       vous pouvez le redistribuer ou le
 *  modify it under the terms of         modifier suivant les termes de
 *  the GNU Affero General Public        la "GNU Affero General Public
 *  License as published by the          License" telle que publiée
 *  Free Software Foundation,            par la Free Software Foundation
 *  either version 3 of the              : soit la version 3 de cette
 *  License, or (at your option)         licence, soit (à votre gré)
 *  any later version.                   toute version ultérieure.
 *
 *  OpenCADC is distributed in the       OpenCADC est distribué
 *  hope that it will be useful,         dans l'espoir qu'il vous
 *  but WITHOUT ANY WARRANTY;            sera utile, mais SANS AUCUNE
 *  without even the implied             GARANTIE : sans même la garantie
 *  warranty of MERCHANTABILITY          implicite de COMMERCIALISABILITÉ
 *  or FITNESS FOR A PARTICULAR          ni d'ADÉQUATION À UN OBJECTIF
 *  PURPOSE.  See the GNU Affero         PARTICULIER. Consultez la Licence
 *  General Public License for           Générale Publique GNU Affero
 *  more details.                        pour plus de détails.
 *
 *  You should have received             Vous devriez avoir reçu une
 *  a copy of the GNU Affero             copie de la Licence Générale
 *  General Public License along         Publique GNU Affero avec
 *  with OpenCADC.  If not, see          OpenCADC ; si ce n'est
 *  <http://www.gnu.org/licenses/>.      pas le cas, consultez :
 *                                       <http://www.gnu.org/licenses/>.
 *
 ************************************************************************
 */

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
    return { exists: true, created: false }
  }

  if (getResponse.status !== 404) {
    // Continue to try creating the node anyway
  }

  // Node doesn't exist, create it
  const nodeXml = buildDataNodeXml(vosPath)

  const createResponse = await fetch(nodeUrl, {
    method: 'PUT',
    headers: {
      ...authHeaders,
      'Content-Type': 'text/xml',
    },
    body: nodeXml,
  })

  if (createResponse.ok || createResponse.status === 201) {
    return { exists: true, created: true }
  }

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

  // Extract the job URL (without /results/transferDetails)
  const jobUrl = locationUrl.replace('/results/transferDetails', '')

  // Step 2: GET the job XML to check status
  const jobResponse = await fetch(jobUrl, {
    method: 'GET',
    headers: {
      ...authHeaders,
      Accept: 'text/xml',
    },
  })

  if (!jobResponse.ok) {
    const errorText = await jobResponse.text().catch(() => '')
    throw new Error(`Failed to get transfer job: ${jobResponse.status}: ${errorText}`)
  }

  const jobXml = await jobResponse.text()

  // Parse the UWS job response
  const { phase, transferDetailsUrl, error } = parseUwsJobXml(jobXml)

  if (phase === 'ERROR') {
    throw new Error(`Transfer job failed: ${error || 'Unknown error'}`)
  }

  if (!transferDetailsUrl) {
    throw new Error('No transferDetails URL in transfer job response')
  }

  // Step 3: GET the transferDetails URL to get the actual endpoint
  const transferDetailsResponse = await fetch(transferDetailsUrl, {
    method: 'GET',
    headers: {
      ...authHeaders,
      Accept: 'text/xml',
    },
  })

  if (!transferDetailsResponse.ok) {
    const errorText = await transferDetailsResponse.text().catch(() => '')
    throw new Error(
      `Failed to get transfer details: ${transferDetailsResponse.status}: ${errorText}`,
    )
  }

  const transferDetailsXml = await transferDetailsResponse.text()

  // Parse the actual upload endpoint from transfer details
  const uploadEndpoint = parseTransferDetailsXml(transferDetailsXml)

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

    // Step 1: Ensure the DataNode exists (required before upload)
    await ensureDataNodeExists(filePath, accessToken)

    // Step 2: Build transfer XML and negotiate upload endpoint
    const transferXml = buildTransferXml(filePath)

    const uploadEndpoint = await negotiateTransfer(transferXml, accessToken)

    // Convert JSON to string for upload
    const jsonContent = JSON.stringify(fileJson, null, 2)

    // Step 3: PUT the file content to the negotiated endpoint
    const response = await fetch(uploadEndpoint, {
      method: 'PUT',
      headers: {
        Cookie: `CADC_SSO=${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: jsonContent,
    })

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

/**
 * Update metadata fields in an existing RAFT.json file.
 * Downloads the current file, merges metadata, and re-uploads.
 */
export const updateRaftMetadata = async (
  dataDirectory: string,
  metadataUpdate: Partial<TRaftContext>,
  accessToken: string,
): Promise<IResponseData<boolean>> => {
  try {
    // Step 1: Download current RAFT.json
    const downloadResult = await downloadRaftFile(dataDirectory, accessToken)
    if (!downloadResult.success || !downloadResult.data) {
      return { success: false, message: 'Failed to download RAFT.json for metadata update' }
    }

    // Step 2: Merge metadata fields (append to statusHistory instead of replacing)
    const existingHistory =
      (downloadResult.data as TRaftContext & { statusHistory?: unknown[] }).statusHistory || []
    const newHistory =
      (metadataUpdate as TRaftContext & { statusHistory?: unknown[] }).statusHistory || []

    // Deduplicate: skip new entries whose toStatus matches the last recorded toStatus
    // This prevents redundant entries when an action fires for an already-completed transition
    const lastExisting = existingHistory[existingHistory.length - 1] as
      | { toStatus?: string }
      | undefined
    const filteredNewHistory = newHistory.filter((entry) => {
      const typed = entry as { toStatus?: string }
      if (lastExisting && lastExisting.toStatus === typed.toStatus) {
        return false
      }
      return true
    })

    const updatedData: TRaftContext = {
      ...downloadResult.data,
      ...metadataUpdate,
      statusHistory: [...existingHistory, ...filteredNewHistory],
    }

    // Step 3: Re-upload via the existing uploadFile function
    // Extract the DOI identifier from the dataDirectory path
    // dataDirectory is like "/rafts-test/RAFTS-xxx/data" — we need the RAFTS-xxx part
    const parts = dataDirectory.split('/')
    const doiIndex = parts.findIndex((p) => p.startsWith('RAFTS-'))
    const doiIdentifier = doiIndex >= 0 ? parts[doiIndex] : parts[parts.length - 2]

    const uploadResult = await uploadFile(doiIdentifier, updatedData, accessToken)
    if (uploadResult.error) {
      return { success: false, message: uploadResult.error.message }
    }

    return { success: true, data: true }
  } catch (error) {
    console.error('[updateRaftMetadata] Error:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
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
    return { success: true, data }
  } catch (error) {
    console.error('[downloadRaftFile] Exception:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}
