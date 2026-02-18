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

  // Check if node exists
  const getResponse = await fetch(nodeUrl, {
    method: 'GET',
    headers: { ...authHeaders, Accept: 'text/xml' },
  })

  if (getResponse.ok) {
    return { exists: true, created: false }
  }

  // Create the container node
  const nodeXml = buildContainerNodeXml(vosPath)
  const createResponse = await fetch(nodeUrl, {
    method: 'PUT',
    headers: { ...authHeaders, 'Content-Type': 'text/xml' },
    body: nodeXml,
  })

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
 * Uses UWS (Universal Worker Service) job pattern
 */
export async function negotiateTransfer(vosPath: string, accessToken: string): Promise<string> {
  const transferXml = buildTransferXml(vosPath)
  const authHeaders = { Cookie: `CADC_SSO=${accessToken}` }

  // Step 1: POST transfer request to synctrans
  const synctransResponse = await fetch(VAULT_SYNCTRANS_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'text/xml', ...authHeaders },
    body: transferXml,
    redirect: 'manual',
  })

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
    // Step 1: Ensure DataNode exists
    await ensureDataNodeExists(vosPath, accessToken)

    // Step 2: Negotiate transfer
    const uploadEndpoint = await negotiateTransfer(vosPath, accessToken)

    // Step 3: PUT the content
    const response = await fetch(uploadEndpoint, {
      method: 'PUT',
      headers: {
        Cookie: `CADC_SSO=${accessToken}`,
        'Content-Type': mimeType,
      },
      body: content,
    })

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
