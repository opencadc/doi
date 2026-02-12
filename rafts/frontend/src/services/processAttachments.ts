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
 * Process Attachments for Save
 *
 * This module handles converting inline attachments (base64 images, text content)
 * to FileReferences by uploading them to VOSpace during form save.
 *
 * This is a server-side only module - called from server actions.
 */

import { TRaftContext } from '@/context/types'
import {
  PROP_OBSERVATION_INFO,
  PROP_TECHNICAL_INFO,
  PROP_FIGURE,
  PROP_EPHEMERIS,
  PROP_ORBITAL_ELEMENTS,
  PROP_SPECTROSCOPY,
  PROP_ASTROMETRY,
} from '@/shared/constants'
import {
  FileReference,
  isFileReference,
  isBase64DataUrl,
  getMimeTypeFromBase64,
  createFileReference,
} from '@/types/attachments'
import { uploadToVOSpaceFolder } from '@/services/vospaceTransfer'
import { getCurrentPath } from '@/services/utils'

const ATTACHMENTS_FOLDER = 'attachments'

/**
 * Attachment field configuration
 */
interface AttachmentFieldConfig {
  section: string
  field: string
  filename: string
  mimeType: string
  isBinary: boolean
}

/**
 * All attachment fields in the form
 */
const ATTACHMENT_FIELDS: AttachmentFieldConfig[] = [
  {
    section: PROP_OBSERVATION_INFO,
    field: PROP_FIGURE,
    filename: 'figure.png',
    mimeType: 'image/png',
    isBinary: true,
  },
  {
    section: PROP_TECHNICAL_INFO,
    field: PROP_EPHEMERIS,
    filename: 'ephemeris.txt',
    mimeType: 'text/plain',
    isBinary: false,
  },
  {
    section: PROP_TECHNICAL_INFO,
    field: PROP_ORBITAL_ELEMENTS,
    filename: 'orbital.txt',
    mimeType: 'text/plain',
    isBinary: false,
  },
  {
    section: PROP_TECHNICAL_INFO,
    field: PROP_SPECTROSCOPY,
    filename: 'spectrum.txt',
    mimeType: 'text/plain',
    isBinary: false,
  },
  {
    section: PROP_TECHNICAL_INFO,
    field: PROP_ASTROMETRY,
    filename: 'astrometry.xml',
    mimeType: 'text/xml',
    isBinary: false,
  },
]

/**
 * Check if a value is already a FileReference (either object or JSON string)
 */
function isAlreadyFileReference(value: unknown): boolean {
  if (!value) return false
  if (isFileReference(value)) return true

  // Check if it's a JSON string representing a FileReference
  if (typeof value === 'string' && value.startsWith('{')) {
    try {
      const parsed = JSON.parse(value)
      return isFileReference(parsed)
    } catch {
      return false
    }
  }

  return false
}

/**
 * Parse a FileReference from a value (could be object or JSON string)
 */
function parseFileReference(value: unknown): FileReference | null {
  if (isFileReference(value)) return value

  if (typeof value === 'string' && value.startsWith('{')) {
    try {
      const parsed = JSON.parse(value)
      if (isFileReference(parsed)) return parsed
    } catch {
      // Not valid JSON
    }
  }

  return null
}

/**
 * Convert base64 data URL to Buffer for server-side upload
 */
function base64ToBuffer(base64: string): Buffer {
  // Remove the data URL prefix (e.g., "data:image/png;base64,")
  const base64Data = base64.split(',')[1]
  return Buffer.from(base64Data, 'base64')
}

/**
 * Get the attachments folder path for a DOI
 */
function getAttachmentsFolderPath(doiIdentifier: string): string {
  const basePath = getCurrentPath(doiIdentifier)
  return `${basePath}/${ATTACHMENTS_FOLDER}`
}

/**
 * Process all attachments in form data, uploading them to VOSpace
 * and replacing inline content with FileReferences.
 *
 * @param formData - The form data to process
 * @param doiIdentifier - The DOI identifier for the RAFT
 * @param accessToken - The CADC SSO access token
 * @returns The processed form data with FileReferences instead of inline content
 */
export async function processAttachmentsForSave(
  formData: TRaftContext,
  doiIdentifier: string,
  accessToken: string,
): Promise<TRaftContext> {
  // Create a deep copy of the form data
  const processedData: TRaftContext = JSON.parse(JSON.stringify(formData))
  const folderPath = getAttachmentsFolderPath(doiIdentifier)

  for (const config of ATTACHMENT_FIELDS) {
    const section = processedData[config.section as keyof TRaftContext] as Record<string, unknown>
    if (!section) continue

    const value = section[config.field]
    if (!value) continue

    // Skip if already a FileReference
    if (isAlreadyFileReference(value)) {
      // Ensure it's stored as JSON string for consistency
      const fileRef = parseFileReference(value)
      if (fileRef) {
        section[config.field] = JSON.stringify(fileRef)
      }
      continue
    }

    // Skip if value is empty string
    if (typeof value === 'string' && value.trim() === '') {
      continue
    }

    try {
      let content: string | Buffer
      let mimeType = config.mimeType
      let filename = config.filename
      let contentSize = 0

      if (config.isBinary && typeof value === 'string' && isBase64DataUrl(value)) {
        // Binary content (e.g., image) - convert from base64
        mimeType = getMimeTypeFromBase64(value)
        content = base64ToBuffer(value)
        contentSize = content.length

        // Update filename extension based on actual mime type
        if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') {
          filename = 'figure.jpg'
        } else if (mimeType === 'image/png') {
          filename = 'figure.png'
        }
      } else if (typeof value === 'string') {
        // Text content
        content = value
        contentSize = Buffer.byteLength(content, 'utf8')
      } else {
        continue
      }

      // Upload to VOSpace
      const result = await uploadToVOSpaceFolder(
        folderPath,
        filename,
        content,
        mimeType,
        accessToken,
      )

      if (result.success) {
        // Create FileReference and store as JSON string
        const fileReference = createFileReference(filename, mimeType, contentSize)
        section[config.field] = JSON.stringify(fileReference)
      } else {
        console.error(`[processAttachments] ${config.field}: Upload failed:`, result.error)
        // Keep original value on failure - don't lose user data
      }
    } catch (error) {
      console.error(`[processAttachments] ${config.field}: Exception:`, error)
      // Keep original value on failure
    }
  }

  return processedData
}

/**
 * Get the count of inline attachments that need to be uploaded
 */
export function getInlineAttachmentCount(formData: TRaftContext): number {
  let count = 0

  for (const config of ATTACHMENT_FIELDS) {
    const section = formData[config.section as keyof TRaftContext] as Record<string, unknown>
    if (!section) continue

    const value = section[config.field]
    if (!value) continue

    // Count if it's inline content (not already a FileReference)
    if (!isAlreadyFileReference(value) && typeof value === 'string' && value.trim() !== '') {
      count++
    }
  }

  return count
}
