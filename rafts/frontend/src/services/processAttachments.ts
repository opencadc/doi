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

  console.log('[processAttachments] Starting attachment processing for DOI:', doiIdentifier)
  console.log('[processAttachments] Attachments folder:', folderPath)

  for (const config of ATTACHMENT_FIELDS) {
    const section = processedData[config.section as keyof TRaftContext] as Record<string, unknown>
    if (!section) continue

    const value = section[config.field]
    if (!value) continue

    // Skip if already a FileReference
    if (isAlreadyFileReference(value)) {
      console.log(`[processAttachments] ${config.field}: Already a FileReference, skipping`)
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

    console.log(`[processAttachments] ${config.field}: Processing inline content`)

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

        console.log(
          `[processAttachments] ${config.field}: Uploading binary (${mimeType}, ${contentSize} bytes)`,
        )
      } else if (typeof value === 'string') {
        // Text content
        content = value
        contentSize = Buffer.byteLength(content, 'utf8')
        console.log(`[processAttachments] ${config.field}: Uploading text (${contentSize} bytes)`)
      } else {
        console.log(`[processAttachments] ${config.field}: Unknown value type, skipping`)
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
        console.log(`[processAttachments] ${config.field}: Upload successful`)
      } else {
        console.error(`[processAttachments] ${config.field}: Upload failed:`, result.error)
        // Keep original value on failure - don't lose user data
      }
    } catch (error) {
      console.error(`[processAttachments] ${config.field}: Exception:`, error)
      // Keep original value on failure
    }
  }

  console.log('[processAttachments] Attachment processing complete')
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
