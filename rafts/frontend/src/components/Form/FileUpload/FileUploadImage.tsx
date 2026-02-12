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

import React, { useState, useRef, ChangeEvent, useEffect } from 'react'
import {
  Button,
  Box,
  Typography,
  CircularProgress,
  Alert,
  IconButton,
  LinearProgress,
} from '@mui/material'
import { Image as ImageIcon, X, Upload, Cloud } from 'lucide-react'
import ImageComponent from 'next/image'
import { useAttachmentUpload } from '@/hooks/useAttachmentUpload'
import {
  FileReference,
  AttachmentValue,
  isFileReference,
  isBase64DataUrl,
  ATTACHMENT_CONFIGS,
} from '@/types/attachments'

interface FileUploadImageProps {
  /** Callback when image is loaded - receives base64 data URL or FileReference */
  onImageLoaded: (data: string | FileReference) => void
  /** Callback when image is cleared */
  onClear: () => void
  /** Initial image value - can be base64 string or FileReference */
  initialImage?: AttachmentValue
  /** Accepted file types */
  accept?: string
  /** Maximum file size in bytes */
  maxSize?: number
  /** Label for the upload area */
  label?: string
  /** Hint text shown in upload area */
  hint?: string
  /** DOI identifier - if provided, uploads to VOSpace instead of base64 */
  doiIdentifier?: string
  /** Custom filename for the uploaded file */
  customFilename?: string
}

/**
 * Component for handling image uploads (PNG/JPG) in forms
 *
 * Supports two modes:
 * 1. Legacy mode (no doiIdentifier): Converts to base64 and stores inline
 * 2. VOSpace mode (with doiIdentifier): Uploads to VOSpace and returns FileReference
 */
const FileUploadImage: React.FC<FileUploadImageProps> = ({
  onImageLoaded,
  onClear,
  initialImage,
  accept = 'image/png, image/jpeg, image/jpg',
  maxSize = 5 * 1024 * 1024, // 5MB default
  label = 'Upload Image',
  hint = 'Select or drag & drop an image (PNG, JPG)',
  doiIdentifier,
  customFilename,
}) => {
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [imagePreview, setImagePreview] = useState<string>('')
  const [currentFileRef, setCurrentFileRef] = useState<FileReference | null>(null)
  const [isPreviewLoading, setIsPreviewLoading] = useState<boolean>(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  // Track the last resolved image to avoid re-fetching on unrelated re-renders
  const lastResolvedRef = useRef<string | null>(null)

  // Use attachment upload hook when doiIdentifier is provided
  const {
    isUploading,
    progress,
    error: uploadError,
    uploadFile: uploadToVOSpace,
    resolveAttachment,
    canUpload,
    deleteFile,
  } = useAttachmentUpload({
    doiIdentifier,
    config: ATTACHMENT_CONFIGS.figure,
  })

  // Determine if we're in VOSpace upload mode
  const useVOSpaceUpload = Boolean(doiIdentifier) && canUpload

  // Resolve initial image on mount or when it changes
  useEffect(() => {
    const resolveInitialImage = async () => {
      if (!initialImage) {
        if (lastResolvedRef.current !== null) {
          setImagePreview('')
          setCurrentFileRef(null)
          setIsPreviewLoading(false)
          lastResolvedRef.current = null
        }
        return
      }

      // Create a stable key for comparison
      const imageKey = isFileReference(initialImage)
        ? `ref:${initialImage.filename}`
        : typeof initialImage === 'string'
          ? `str:${initialImage.substring(0, 50)}`
          : null

      // Skip if we've already resolved this exact image
      if (imageKey && lastResolvedRef.current === imageKey) {
        return
      }

      // If it's a FileReference, store it and resolve to displayable content
      if (isFileReference(initialImage)) {
        setCurrentFileRef(initialImage)
        setIsPreviewLoading(true) // Start loading spinner for API fetch
        const resolved = await resolveAttachment(initialImage)
        if (resolved) {
          setImagePreview(resolved)
          lastResolvedRef.current = imageKey
          // Note: isPreviewLoading will be set to false by onLoad handler
        } else {
          setIsPreviewLoading(false)
        }
      } else if (typeof initialImage === 'string' && isBase64DataUrl(initialImage)) {
        // It's a base64 string - no loading needed
        setImagePreview(initialImage)
        setCurrentFileRef(null)
        setIsPreviewLoading(false)
        lastResolvedRef.current = imageKey
      }
    }

    resolveInitialImage()
  }, [initialImage, resolveAttachment])

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files

    if (files && files.length > 0) {
      processFile(files[0])
    }

    // Reset the input value to allow selecting the same file again
    if (event.target) {
      event.target.value = ''
    }
  }

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()

    if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
      processFile(event.dataTransfer.files[0])
    }
  }

  const processFile = async (file: File) => {
    // Reset states
    setError(null)

    // Check file type
    if (
      !file.type.includes('image/png') &&
      !file.type.includes('image/jpeg') &&
      !file.type.includes('image/jpg')
    ) {
      setError('Please upload a PNG or JPG image')
      return
    }

    // Check file size
    if (file.size > maxSize) {
      setError(`File is too large. Maximum size is ${maxSize / 1024 / 1024}MB`)
      return
    }

    // If VOSpace upload is enabled, upload to VOSpace
    if (useVOSpaceUpload) {
      setIsLoading(true)
      try {
        // Build filename with proper extension
        const extension = getExtensionFromType(file.type)
        const baseFilename = customFilename || 'figure'
        // Ensure filename has the correct extension
        const filename = baseFilename.includes('.') ? baseFilename : `${baseFilename}${extension}`
        const result = await uploadToVOSpace(file, filename)

        if (result.success && result.fileReference) {
          // Show preview immediately
          const reader = new FileReader()
          reader.onload = (e) => {
            setImagePreview(e.target?.result as string)
          }
          reader.readAsDataURL(file)

          setCurrentFileRef(result.fileReference)
          onImageLoaded(result.fileReference)
        } else {
          setError(result.error || 'Upload failed')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Upload failed')
      } finally {
        setIsLoading(false)
      }
      return
    }

    // Legacy mode: convert to base64
    setIsLoading(true)
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const base64Data = e.target?.result as string
        setImagePreview(base64Data)
        setCurrentFileRef(null)
        onImageLoaded(base64Data)
      } catch (err) {
        console.error(err)
        setError('Error processing image')
      } finally {
        setIsLoading(false)
      }
    }

    reader.onerror = () => {
      setError('Error reading file')
      setIsLoading(false)
    }

    reader.readAsDataURL(file)
  }

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
  }

  const handleClick = () => {
    if (!imagePreview && fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const handleClear = async () => {
    // If we have a FileReference and doiIdentifier, delete from VOSpace
    if (currentFileRef && doiIdentifier) {
      try {
        await deleteFile(currentFileRef.filename)
      } catch (err) {
        console.error('[FileUploadImage] Failed to delete from VOSpace:', err)
        // Continue with UI clear even if delete fails
      }
    }

    setError(null)
    setImagePreview('')
    setCurrentFileRef(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    onClear()
  }

  // Combine loading states
  const showLoading = isLoading || isUploading
  const displayError = error || uploadError

  // Helper to get file extension from MIME type
  function getExtensionFromType(mimeType: string): string {
    const extensions: Record<string, string> = {
      'image/png': '.png',
      'image/jpeg': '.jpg',
      'image/jpg': '.jpg',
    }
    return extensions[mimeType] || '.png'
  }

  return (
    <Box sx={{ width: '100%', mb: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <Typography variant="subtitle1" className="font-semibold">
          {label}
        </Typography>
        {useVOSpaceUpload && (
          <Box component="span" title="Uploads to cloud storage" sx={{ display: 'flex' }}>
            <Cloud size={16} color="#1976d2" />
          </Box>
        )}
      </Box>

      <input
        type="file"
        ref={fileInputRef}
        accept={accept}
        onChange={handleFileChange}
        style={{ display: 'none' }}
        data-testid="image-file-input"
      />

      {!imagePreview ? (
        <Box
          sx={{
            border: '2px dashed',
            borderColor: displayError ? 'error.main' : !doiIdentifier ? 'warning.main' : 'divider',
            borderRadius: 1,
            p: 3,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: !doiIdentifier ? 'action.disabledBackground' : 'background.paper',
            cursor: showLoading || !doiIdentifier ? 'not-allowed' : 'pointer',
            transition: 'border-color 0.3s ease',
            '&:hover': {
              borderColor: showLoading || !doiIdentifier ? undefined : 'primary.main',
            },
          }}
          onClick={showLoading || !doiIdentifier ? undefined : handleClick}
          onDrop={showLoading || !doiIdentifier ? undefined : handleDrop}
          onDragOver={handleDragOver}
        >
          {!doiIdentifier ? (
            <Box sx={{ textAlign: 'center' }}>
              <ImageIcon size={40} color="#9e9e9e" />
              <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
                Save the form first to enable file uploads
              </Typography>
            </Box>
          ) : showLoading ? (
            <Box sx={{ width: '100%', textAlign: 'center' }}>
              <CircularProgress size={40} />
              {isUploading && (
                <Box sx={{ mt: 2, width: '80%', mx: 'auto' }}>
                  <LinearProgress variant="determinate" value={progress} />
                  <Typography variant="caption" sx={{ mt: 1 }}>
                    Uploading to cloud storage...
                  </Typography>
                </Box>
              )}
            </Box>
          ) : (
            <>
              <Upload size={40} color="#9e9e9e" />
              <Typography variant="body1" sx={{ mt: 2, textAlign: 'center' }}>
                {hint}
              </Typography>
              <Button variant="contained" sx={{ mt: 2 }} startIcon={<Upload size={16} />}>
                Browse Files
              </Button>
            </>
          )}
        </Box>
      ) : (
        <Box sx={{ position: 'relative', width: 'fit-content' }}>
          {/* Show spinner while loading image from API */}
          {isPreviewLoading && (
            <Box
              sx={{
                width: '100px',
                height: '100px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '4px',
                border: '1px solid #e0e0e0',
                bgcolor: 'action.hover',
              }}
            >
              <CircularProgress size={24} />
            </Box>
          )}
          {/* Use regular img for API routes, Next.js Image for base64 */}
          {imagePreview.startsWith('/api/') ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imagePreview}
              alt="Uploaded preview"
              style={{
                width: '100px',
                height: '100px',
                objectFit: 'cover',
                borderRadius: '4px',
                border: '1px solid #e0e0e0',
                display: isPreviewLoading ? 'none' : 'block',
              }}
              onLoad={() => setIsPreviewLoading(false)}
              onError={() => setIsPreviewLoading(false)}
            />
          ) : (
            <ImageComponent
              src={imagePreview}
              alt="Uploaded preview"
              style={{
                width: '100px',
                height: '100px',
                objectFit: 'cover',
                borderRadius: '4px',
                border: '1px solid #e0e0e0',
              }}
              width={100}
              height={100}
              onLoad={() => setIsPreviewLoading(false)}
            />
          )}
          {currentFileRef && (
            <Box
              sx={{
                position: 'absolute',
                bottom: -8,
                left: 0,
                right: 0,
                display: 'flex',
                justifyContent: 'center',
              }}
            >
              <Box
                sx={{
                  bgcolor: 'primary.main',
                  color: 'white',
                  px: 0.5,
                  py: 0.25,
                  borderRadius: 0.5,
                  fontSize: '0.65rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.25,
                }}
              >
                <Cloud size={10} />
                Stored
              </Box>
            </Box>
          )}
          <IconButton
            size="small"
            sx={{
              position: 'absolute',
              top: -10,
              right: -10,
              bgcolor: 'background.paper',
              border: '1px solid',
              borderColor: 'divider',
              '&:hover': {
                bgcolor: 'error.light',
                color: 'white',
              },
            }}
            onClick={handleClear}
            disabled={showLoading}
          >
            <X size={16} />
          </IconButton>
        </Box>
      )}

      {displayError && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {displayError}
        </Alert>
      )}
    </Box>
  )
}

export default FileUploadImage
