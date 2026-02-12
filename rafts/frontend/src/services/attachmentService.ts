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

/**
 * Attachment Service for VOSpace
 *
 * Provides functions to upload, download, and manage file attachments
 * stored in VOSpace. Uses the VOSpace Transfer API for reliable uploads.
 */

import {
  FileReference,
  createFileReference,
  sanitizeFilename,
  isTextMimeType,
  blobToBase64,
} from '@/types/attachments'
import {
  VAULT_SYNCTRANS_ENDPOINT,
  VOSPACE_AUTHORITY,
  VAULT_BASE_ENDPOINT,
} from '@/services/constants'
import { getCurrentPath } from '@/services/utils'

// ============================================================================
// Constants
// ============================================================================

const VAULT_NODES_ENDPOINT =
  process.env.NEXT_VAULT_NODES_ENDPOINT || 'https://ws-cadc.canfar.net/vault/nodes'

// ============================================================================
// Path Utilities
// ============================================================================

/**
 * Get the VOSpace path for a specific attachment (goes directly into data folder)
 */
export function getAttachmentPath(doiIdentifier: string, filename: string): string {
  const basePath = getCurrentPath(doiIdentifier)
  return `${basePath}/${sanitizeFilename(filename)}`
}

/**
 * Get the download URL for an attachment
 */
export function getAttachmentDownloadUrl(doiIdentifier: string, filename: string): string {
  const path = getAttachmentPath(doiIdentifier, filename)
  return `${VAULT_BASE_ENDPOINT}/${path}`
}

// ============================================================================
// VOSpace Transfer Protocol
// ============================================================================

/**
 * Build VOSpace transfer XML for pushing a file
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
 * Build DataNode XML for creating a file node
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
 * Parse UWS job XML to extract phase and transferDetails URL
 */
function parseUwsJobXml(xml: string): {
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
function parseTransferDetailsXml(xml: string): string | null {
  const endpointMatch = xml.match(/<vos:endpoint>([^<]+)<\/vos:endpoint>/)
  return endpointMatch ? endpointMatch[1] : null
}

// ============================================================================
// Node Management
// ============================================================================

/**
 * Ensure a DataNode (file placeholder) exists in VOSpace
 */
async function ensureDataNodeExists(
  vosPath: string,
  accessToken: string,
): Promise<{ exists: boolean; created: boolean }> {
  const nodeUrl = `${VAULT_NODES_ENDPOINT}/${vosPath}`
  const authHeaders = { Cookie: `CADC_SSO=${accessToken}` }

  // Check if node exists
  const getResponse = await fetch(nodeUrl, {
    method: 'GET',
    headers: { ...authHeaders, Accept: 'text/xml' },
  })

  if (getResponse.ok) {
    return { exists: true, created: false }
  }

  // Create the data node
  const nodeXml = buildDataNodeXml(vosPath)
  const createResponse = await fetch(nodeUrl, {
    method: 'PUT',
    headers: { ...authHeaders, 'Content-Type': 'text/xml' },
    body: nodeXml,
  })

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
 */
async function negotiateTransfer(vosPath: string, accessToken: string): Promise<string> {
  const authHeaders = { Cookie: `CADC_SSO=${accessToken}` }
  const transferXml = buildTransferXml(vosPath)

  // Step 1: POST transfer request to synctrans
  const synctransResponse = await fetch(VAULT_SYNCTRANS_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'text/xml', ...authHeaders },
    body: transferXml,
    redirect: 'manual',
  })

  if (synctransResponse.status !== 303) {
    const errorText = await synctransResponse.text().catch(() => '')
    throw new Error(`Transfer negotiation failed: ${synctransResponse.status} ${errorText}`)
  }

  const locationUrl = synctransResponse.headers.get('Location')
  if (!locationUrl) {
    throw new Error('No Location header in synctrans response')
  }

  // Step 2: GET the job XML to check status
  const jobUrl = locationUrl.replace('/results/transferDetails', '')
  const jobResponse = await fetch(jobUrl, {
    method: 'GET',
    headers: { ...authHeaders, Accept: 'text/xml' },
  })

  if (!jobResponse.ok) {
    throw new Error(`Failed to get transfer job: ${jobResponse.status}`)
  }

  const jobXml = await jobResponse.text()
  const { phase, transferDetailsUrl, error } = parseUwsJobXml(jobXml)

  if (phase === 'ERROR') {
    throw new Error(`Transfer job failed: ${error || 'Unknown error'}`)
  }

  if (!transferDetailsUrl) {
    throw new Error('No transferDetails URL in job response')
  }

  // Step 3: GET the transferDetails URL to get the actual endpoint
  const transferDetailsResponse = await fetch(transferDetailsUrl, {
    method: 'GET',
    headers: { ...authHeaders, Accept: 'text/xml' },
  })

  if (!transferDetailsResponse.ok) {
    throw new Error(`Failed to get transfer details: ${transferDetailsResponse.status}`)
  }

  const transferDetailsXml = await transferDetailsResponse.text()
  const uploadEndpoint = parseTransferDetailsXml(transferDetailsXml)

  if (!uploadEndpoint) {
    throw new Error('No endpoint URL in transfer details')
  }

  return uploadEndpoint
}

// ============================================================================
// Public API: Upload
// ============================================================================

export interface UploadResult {
  success: boolean
  fileReference?: FileReference
  error?: string
}

/**
 * Upload an attachment file to VOSpace
 *
 * @param doiIdentifier - The DOI identifier (e.g., "RAFTS-xxx")
 * @param filename - The filename to use for storage
 * @param content - File content as Blob or string
 * @param mimeType - MIME type of the file
 * @param accessToken - CADC SSO access token
 * @returns Upload result with FileReference on success
 */
export async function uploadAttachment(
  doiIdentifier: string,
  filename: string,
  content: Blob | string,
  mimeType: string,
  accessToken: string,
): Promise<UploadResult> {
  try {
    const sanitizedFilename = sanitizeFilename(filename)
    const filePath = getAttachmentPath(doiIdentifier, sanitizedFilename)

    // Step 1: Ensure DataNode exists (data folder is created by DOI service)
    const nodeResult = await ensureDataNodeExists(filePath, accessToken)

    if (!nodeResult.exists) {
      throw new Error(`Failed to create data node: ${filePath}`)
    }

    // Step 2: Negotiate transfer and get upload endpoint
    const uploadEndpoint = await negotiateTransfer(filePath, accessToken)

    // Step 3: Prepare content for upload
    let body: Blob | string
    let contentLength: number

    if (content instanceof Blob) {
      body = content
      contentLength = content.size
    } else {
      body = content
      contentLength = new Blob([content]).size
    }

    // Step 4: Upload the file
    const response = await fetch(uploadEndpoint, {
      method: 'PUT',
      headers: {
        Cookie: `CADC_SSO=${accessToken}`,
        'Content-Type': mimeType,
      },
      body,
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => '')
      throw new Error(`Upload failed: ${response.status} ${errorText}`)
    }

    // Create and return FileReference
    const fileReference = createFileReference(sanitizedFilename, mimeType, contentLength)

    return { success: true, fileReference }
  } catch (error) {
    console.error('[uploadAttachment] Error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}

/**
 * Upload a File object to VOSpace
 * Convenience wrapper around uploadAttachment
 */
export async function uploadFile(
  doiIdentifier: string,
  file: File,
  accessToken: string,
  customFilename?: string,
): Promise<UploadResult> {
  const filename = customFilename || file.name
  return uploadAttachment(doiIdentifier, filename, file, file.type, accessToken)
}

// ============================================================================
// Public API: Download
// ============================================================================

export interface DownloadResult {
  success: boolean
  content?: Blob | string
  mimeType?: string
  error?: string
}

/**
 * Download an attachment from VOSpace
 *
 * @param doiIdentifier - The DOI identifier
 * @param filename - The filename to download
 * @param accessToken - CADC SSO access token
 * @param asText - If true, return content as text string
 * @returns Download result with content on success
 */
export async function downloadAttachment(
  doiIdentifier: string,
  filename: string,
  accessToken: string,
  asText: boolean = false,
): Promise<DownloadResult> {
  try {
    const url = getAttachmentDownloadUrl(doiIdentifier, filename)

    const response = await fetch(url, {
      method: 'GET',
      headers: { Cookie: `CADC_SSO=${accessToken}` },
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => '')
      throw new Error(`Download failed: ${response.status} ${errorText}`)
    }

    const mimeType = response.headers.get('Content-Type') || 'application/octet-stream'
    let content: Blob | string

    if (asText || isTextMimeType(mimeType)) {
      content = await response.text()
    } else {
      content = await response.blob()
    }

    return { success: true, content, mimeType }
  } catch (error) {
    console.error('[downloadAttachment] Error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}

/**
 * Download an attachment and convert to base64 data URL
 * Useful for displaying images in the browser
 */
export async function downloadAttachmentAsBase64(
  doiIdentifier: string,
  filename: string,
  accessToken: string,
): Promise<{ success: boolean; base64?: string; error?: string }> {
  const result = await downloadAttachment(doiIdentifier, filename, accessToken, false)

  if (!result.success || !result.content) {
    return { success: false, error: result.error }
  }

  try {
    const blob = result.content instanceof Blob ? result.content : new Blob([result.content])
    const base64 = await blobToBase64(blob)
    return { success: true, base64 }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to convert to base64',
    }
  }
}

// ============================================================================
// Public API: Delete
// ============================================================================

/**
 * Delete an attachment from VOSpace
 *
 * @param doiIdentifier - The DOI identifier
 * @param filename - The filename to delete
 * @param accessToken - CADC SSO access token
 * @returns Success status
 */
export async function deleteAttachment(
  doiIdentifier: string,
  filename: string,
  accessToken: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const path = getAttachmentPath(doiIdentifier, filename)
    const nodeUrl = `${VAULT_NODES_ENDPOINT}/${path}`

    const response = await fetch(nodeUrl, {
      method: 'DELETE',
      headers: { Cookie: `CADC_SSO=${accessToken}` },
    })

    if (!response.ok && response.status !== 404) {
      const errorText = await response.text().catch(() => '')
      throw new Error(`Delete failed: ${response.status} ${errorText}`)
    }

    return { success: true }
  } catch (error) {
    console.error('[deleteAttachment] Error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}

// ============================================================================
// Public API: Batch Operations
// ============================================================================

export interface AttachmentInfo {
  fieldName: string
  value: string | Blob
  filename: string
  mimeType: string
}

/**
 * Upload multiple attachments
 * Returns a map of fieldName -> FileReference
 */
export async function uploadMultipleAttachments(
  doiIdentifier: string,
  attachments: AttachmentInfo[],
  accessToken: string,
): Promise<{ results: Record<string, FileReference>; errors: Record<string, string> }> {
  const results: Record<string, FileReference> = {}
  const errors: Record<string, string> = {}

  for (const attachment of attachments) {
    const result = await uploadAttachment(
      doiIdentifier,
      attachment.filename,
      attachment.value,
      attachment.mimeType,
      accessToken,
    )

    if (result.success && result.fileReference) {
      results[attachment.fieldName] = result.fileReference
    } else {
      errors[attachment.fieldName] = result.error || 'Upload failed'
    }
  }

  return { results, errors }
}
