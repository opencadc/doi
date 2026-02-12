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
 * React Hook for Attachment Uploads
 *
 * Provides a clean interface for uploading and managing file attachments
 * in form components. Uses server actions to avoid CORS issues with VOSpace.
 */

'use client'

import { useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import {
  uploadAttachment as uploadAttachmentAction,
  downloadAttachment as downloadAttachmentAction,
  downloadAttachmentAsBase64 as downloadBase64Action,
  deleteAttachment as deleteAttachmentAction,
  UploadAttachmentResult,
  DownloadAttachmentResult,
} from '@/actions/attachments'
import {
  FileReference,
  AttachmentValue,
  isFileReference,
  isBase64DataUrl,
  validateAttachment,
  AttachmentConfig,
  blobToBase64,
} from '@/types/attachments'

// ============================================================================
// Types
// ============================================================================

export interface UseAttachmentUploadOptions {
  /** DOI identifier for the RAFT (required for upload path) */
  doiIdentifier?: string
  /** Attachment configuration for validation */
  config?: AttachmentConfig
  /** Callback when upload completes successfully */
  onUploadComplete?: (fileReference: FileReference) => void
  /** Callback when upload fails */
  onUploadError?: (error: string) => void
  /** Callback when file is cleared */
  onClear?: () => void
}

// Re-export result types for components
export type UploadResult = UploadAttachmentResult
export type DownloadResult = DownloadAttachmentResult

export interface UseAttachmentUploadReturn {
  /** Current upload state */
  isUploading: boolean
  /** Upload progress (0-100) */
  progress: number
  /** Error message if upload failed */
  error: string | null
  /** Upload a File object */
  uploadFile: (file: File, customFilename?: string) => Promise<UploadResult>
  /** Upload content (string or Blob) */
  uploadContent: (
    content: string | Blob,
    filename: string,
    mimeType: string,
  ) => Promise<UploadResult>
  /** Download an attachment */
  downloadFile: (filename: string, asText?: boolean) => Promise<DownloadResult>
  /** Download as base64 (for images) */
  downloadAsBase64: (
    filename: string,
  ) => Promise<{ success: boolean; base64?: string; error?: string }>
  /** Delete an attachment */
  deleteFile: (filename: string) => Promise<{ success: boolean; error?: string }>
  /** Clear the error state */
  clearError: () => void
  /** Check if we have a valid session for uploads */
  canUpload: boolean
  /** Resolve an attachment value to displayable content */
  resolveAttachment: (value: AttachmentValue) => Promise<string | null>
  /** Get the API URL for viewing an attachment (for images) */
  getAttachmentUrl: (filename: string) => string | null
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function useAttachmentUpload(
  options: UseAttachmentUploadOptions = {},
): UseAttachmentUploadReturn {
  const { doiIdentifier, config, onUploadComplete, onUploadError, onClear } = options

  const { data: session } = useSession()

  const [isUploading, setIsUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  // Can upload if we have a DOI identifier and are authenticated
  const canUpload = Boolean(doiIdentifier && session)

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  /**
   * Get the API URL for viewing an attachment (for images)
   */
  const getAttachmentUrl = useCallback(
    (filename: string): string | null => {
      if (!doiIdentifier) return null
      return `/api/attachments/${doiIdentifier}/${encodeURIComponent(filename)}`
    },
    [doiIdentifier],
  )

  /**
   * Upload a File object
   */
  const uploadFile = useCallback(
    async (file: File, customFilename?: string): Promise<UploadResult> => {
      if (!doiIdentifier) {
        const err = 'Cannot upload: missing DOI identifier'
        setError(err)
        onUploadError?.(err)
        return { success: false, error: err }
      }

      if (!session) {
        const err = 'Cannot upload: not authenticated'
        setError(err)
        onUploadError?.(err)
        return { success: false, error: err }
      }

      // Validate file if config is provided
      if (config) {
        const validation = validateAttachment(file, config)
        if (!validation.valid) {
          setError(validation.error || 'Invalid file')
          onUploadError?.(validation.error || 'Invalid file')
          return { success: false, error: validation.error }
        }
      }

      setIsUploading(true)
      setProgress(0)
      setError(null)

      try {
        // Convert file to base64 for transport to server action
        setProgress(20)
        const base64 = await blobToBase64(file)

        setProgress(40)

        // Call server action
        const result = await uploadAttachmentAction(
          doiIdentifier,
          customFilename || file.name,
          base64,
          file.type,
        )

        setProgress(100)

        if (result.success && result.fileReference) {
          onUploadComplete?.(result.fileReference)
        } else {
          setError(result.error || 'Upload failed')
          onUploadError?.(result.error || 'Upload failed')
        }

        return result
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Upload failed'
        setError(errorMsg)
        onUploadError?.(errorMsg)
        return { success: false, error: errorMsg }
      } finally {
        setIsUploading(false)
      }
    },
    [doiIdentifier, session, config, onUploadComplete, onUploadError],
  )

  /**
   * Upload content (string or Blob)
   */
  const uploadContent = useCallback(
    async (content: string | Blob, filename: string, mimeType: string): Promise<UploadResult> => {
      if (!doiIdentifier) {
        const err = 'Cannot upload: missing DOI identifier'
        setError(err)
        onUploadError?.(err)
        return { success: false, error: err }
      }

      if (!session) {
        const err = 'Cannot upload: not authenticated'
        setError(err)
        onUploadError?.(err)
        return { success: false, error: err }
      }

      setIsUploading(true)
      setProgress(0)
      setError(null)

      try {
        // Convert content to base64/string for transport
        setProgress(20)
        let base64Content: string

        if (content instanceof Blob) {
          base64Content = await blobToBase64(content)
        } else {
          base64Content = content
        }

        setProgress(40)

        // Call server action
        const result = await uploadAttachmentAction(
          doiIdentifier,
          filename,
          base64Content,
          mimeType,
        )

        setProgress(100)

        if (result.success && result.fileReference) {
          onUploadComplete?.(result.fileReference)
        } else {
          setError(result.error || 'Upload failed')
          onUploadError?.(result.error || 'Upload failed')
        }

        return result
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Upload failed'
        setError(errorMsg)
        onUploadError?.(errorMsg)
        return { success: false, error: errorMsg }
      } finally {
        setIsUploading(false)
      }
    },
    [doiIdentifier, session, onUploadComplete, onUploadError],
  )

  /**
   * Download an attachment
   */
  const downloadFile = useCallback(
    async (filename: string, asText: boolean = false): Promise<DownloadResult> => {
      if (!doiIdentifier) {
        return {
          success: false,
          error: 'Cannot download: missing DOI identifier',
        }
      }

      return downloadAttachmentAction(doiIdentifier, filename, asText)
    },
    [doiIdentifier],
  )

  /**
   * Download as base64 (for images)
   */
  const downloadAsBase64 = useCallback(
    async (filename: string): Promise<{ success: boolean; base64?: string; error?: string }> => {
      if (!doiIdentifier) {
        return {
          success: false,
          error: 'Cannot download: missing DOI identifier',
        }
      }

      return downloadBase64Action(doiIdentifier, filename)
    },
    [doiIdentifier],
  )

  /**
   * Delete an attachment
   */
  const deleteFile = useCallback(
    async (filename: string): Promise<{ success: boolean; error?: string }> => {
      if (!doiIdentifier) {
        return { success: false, error: 'Cannot delete: missing DOI identifier' }
      }

      const result = await deleteAttachmentAction(doiIdentifier, filename)
      if (result.success) {
        onClear?.()
      }
      return result
    },
    [doiIdentifier, onClear],
  )

  /**
   * Resolve an attachment value to displayable content
   * - If FileReference for image: return API URL for viewing
   * - If FileReference for text: download and return content
   * - If base64 string: return as-is
   * - If text string: return as-is
   */
  const resolveAttachment = useCallback(
    async (value: AttachmentValue): Promise<string | null> => {
      if (!value) return null

      // If it's already a base64 data URL, return as-is
      if (typeof value === 'string' && isBase64DataUrl(value)) {
        return value
      }

      // If it's inline text content, return as-is
      if (typeof value === 'string') {
        return value
      }

      // If it's a FileReference, handle based on type
      if (isFileReference(value)) {
        if (!doiIdentifier) {
          console.warn('[resolveAttachment] Cannot resolve: missing DOI identifier')
          return null
        }

        // For images, use the API route URL (avoids downloading to client memory)
        if (value.mimeType.startsWith('image/')) {
          return getAttachmentUrl(value.filename)
        }

        // For text files, download via server action
        const result = await downloadFile(value.filename, true)
        if (result.success && result.content) {
          return result.content
        }
      }

      return null
    },
    [doiIdentifier, downloadFile, getAttachmentUrl],
  )

  return {
    isUploading,
    progress,
    error,
    uploadFile,
    uploadContent,
    downloadFile,
    downloadAsBase64,
    deleteFile,
    clearError,
    canUpload,
    resolveAttachment,
    getAttachmentUrl,
  }
}
