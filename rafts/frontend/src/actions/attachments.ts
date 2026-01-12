'use server'

/**
 * Server Actions for Attachment Operations
 *
 * These actions wrap the attachmentService functions to be callable from
 * client components. They handle authentication via the session.
 */

import { auth } from '@/auth/cadc-auth/credentials'
import {
  uploadAttachment as uploadToVOSpace,
  downloadAttachment as downloadFromVOSpace,
  downloadAttachmentAsBase64 as downloadBase64FromVOSpace,
  deleteAttachment as deleteFromVOSpace,
} from '@/services/attachmentService'
import { FileReference, getMimeTypeFromExtension } from '@/types/attachments'

// ============================================================================
// Upload Action
// ============================================================================

export interface UploadAttachmentResult {
  success: boolean
  fileReference?: FileReference
  error?: string
}

/**
 * Server action to upload an attachment to VOSpace
 *
 * @param doiIdentifier - The DOI identifier (e.g., "25.0047")
 * @param filename - The filename to use for storage
 * @param base64Content - File content as base64 data URL (for binary) or raw text
 * @param mimeType - MIME type of the file
 * @returns Upload result with FileReference on success
 */
export async function uploadAttachment(
  doiIdentifier: string,
  filename: string,
  base64Content: string,
  mimeType: string,
): Promise<UploadAttachmentResult> {
  const session = await auth()
  const accessToken = session?.accessToken

  if (!accessToken) {
    return { success: false, error: 'Not authenticated' }
  }

  try {
    // Fallback to extension-based MIME type if not provided or empty
    // Browsers often report empty MIME types for .psv, .mpc files
    const effectiveMimeType = mimeType || getMimeTypeFromExtension(filename)

    let content: Blob | string

    // Check if it's a base64 data URL (binary content)
    if (base64Content.startsWith('data:')) {
      // Extract the base64 data from the data URL
      const base64Data = base64Content.split(',')[1]
      const binaryString = Buffer.from(base64Data, 'base64')
      content = new Blob([binaryString], { type: effectiveMimeType })
    } else {
      // It's raw text content
      content = base64Content
    }

    const result = await uploadToVOSpace(
      doiIdentifier,
      filename,
      content,
      effectiveMimeType,
      accessToken,
    )

    return result
  } catch (error) {
    console.error('[uploadAttachment action] Error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed',
    }
  }
}

// ============================================================================
// Download Actions
// ============================================================================

export interface DownloadAttachmentResult {
  success: boolean
  content?: string
  mimeType?: string
  error?: string
}

/**
 * Server action to download an attachment from VOSpace
 *
 * @param doiIdentifier - The DOI identifier
 * @param filename - The filename to download
 * @param asText - If true, return content as text string
 * @returns Download result with content on success
 */
export async function downloadAttachment(
  doiIdentifier: string,
  filename: string,
  asText: boolean = false,
): Promise<DownloadAttachmentResult> {
  const session = await auth()
  const accessToken = session?.accessToken

  if (!accessToken) {
    return { success: false, error: 'Not authenticated' }
  }

  try {
    const result = await downloadFromVOSpace(doiIdentifier, filename, accessToken, asText)

    if (!result.success || !result.content) {
      return { success: false, error: result.error || 'Download failed' }
    }

    // Convert Blob to string for client consumption
    let content: string
    if (result.content instanceof Blob) {
      const buffer = await result.content.arrayBuffer()
      const base64 = Buffer.from(buffer).toString('base64')
      content = `data:${result.mimeType};base64,${base64}`
    } else {
      content = result.content
    }

    return {
      success: true,
      content,
      mimeType: result.mimeType,
    }
  } catch (error) {
    console.error('[downloadAttachment action] Error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Download failed',
    }
  }
}

/**
 * Server action to download an attachment as base64 data URL
 * Useful for displaying images in the browser
 */
export async function downloadAttachmentAsBase64(
  doiIdentifier: string,
  filename: string,
): Promise<{ success: boolean; base64?: string; error?: string }> {
  const session = await auth()
  const accessToken = session?.accessToken

  if (!accessToken) {
    return { success: false, error: 'Not authenticated' }
  }

  try {
    return await downloadBase64FromVOSpace(doiIdentifier, filename, accessToken)
  } catch (error) {
    console.error('[downloadAttachmentAsBase64 action] Error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Download failed',
    }
  }
}

// ============================================================================
// Delete Action
// ============================================================================

/**
 * Server action to delete an attachment from VOSpace
 *
 * @param doiIdentifier - The DOI identifier
 * @param filename - The filename to delete
 * @returns Success status
 */
export async function deleteAttachment(
  doiIdentifier: string,
  filename: string,
): Promise<{ success: boolean; error?: string }> {
  const session = await auth()
  const accessToken = session?.accessToken

  if (!accessToken) {
    return { success: false, error: 'Not authenticated' }
  }

  try {
    return await deleteFromVOSpace(doiIdentifier, filename, accessToken)
  } catch (error) {
    console.error('[deleteAttachment action] Error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Delete failed',
    }
  }
}
