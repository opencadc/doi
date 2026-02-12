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
import { FileText, X, Eye, EyeOff, Upload, Cloud } from 'lucide-react'
import TextPreview from './TextPreview'
import { useAttachmentUpload } from '@/hooks/useAttachmentUpload'
import {
  FileReference,
  AttachmentValue,
  isFileReference,
  isBase64DataUrl,
  AttachmentConfig,
} from '@/types/attachments'

interface TextFileUploadProps {
  /** Callback when file is loaded - receives text content or FileReference */
  onFileLoaded: (data: string | FileReference) => void
  /** Callback when file is cleared */
  onClear: () => void
  /** Initial text value - can be text string or FileReference */
  initialText?: AttachmentValue
  /** Accepted file types */
  accept?: string
  /** Maximum file size in bytes */
  maxSize?: number
  /** Label for the upload area */
  label?: string
  /** Hint text shown in upload area */
  hint?: string
  /** Whether to show text preview */
  showPreview?: boolean
  /** DOI identifier - if provided, uploads to VOSpace instead of inline */
  doiIdentifier?: string
  /** Custom filename for the uploaded file */
  customFilename?: string
  /** Attachment configuration for validation */
  config?: AttachmentConfig
}

/**
 * Component for handling text file uploads in forms
 *
 * Supports two modes:
 * 1. Legacy mode (no doiIdentifier): Stores text content inline
 * 2. VOSpace mode (with doiIdentifier): Uploads to VOSpace and returns FileReference
 */
const TextFileUpload: React.FC<TextFileUploadProps> = ({
  onFileLoaded,
  onClear,
  initialText = '',
  accept = '.txt,text/plain',
  maxSize = 5 * 1024 * 1024, // 5MB default
  label = 'Upload Text File',
  hint = 'Select or drag & drop a text file (.txt)',
  showPreview = true,
  doiIdentifier,
  customFilename,
  config,
}) => {
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string>('')
  const [hasFile, setHasFile] = useState<boolean>(false)
  const [textPreview, setTextPreview] = useState<string>('')
  const [showTextPreview, setShowTextPreview] = useState<boolean>(false)
  const [currentFileRef, setCurrentFileRef] = useState<FileReference | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

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
    config,
  })

  // Determine if we're in VOSpace upload mode
  const useVOSpaceUpload = Boolean(doiIdentifier) && canUpload

  // Resolve initial text on mount or when it changes
  useEffect(() => {
    const resolveInitialText = async () => {
      if (!initialText) {
        setHasFile(false)
        setTextPreview('')
        setCurrentFileRef(null)
        return
      }

      // If it's a FileReference, store it and resolve to displayable content
      if (isFileReference(initialText)) {
        setCurrentFileRef(initialText)
        setFileName(initialText.filename)
        setHasFile(true)
        const resolved = await resolveAttachment(initialText)
        if (resolved) {
          const previewText = resolved.length > 500 ? resolved.substring(0, 500) + '...' : resolved
          setTextPreview(previewText)
          setShowTextPreview(true)
        }
      } else if (typeof initialText === 'string' && !isBase64DataUrl(initialText)) {
        // It's inline text content
        setHasFile(true)
        setCurrentFileRef(null)
        const previewText =
          initialText.length > 500 ? initialText.substring(0, 500) + '...' : initialText
        setTextPreview(previewText)
        setShowTextPreview(true)
      }
    }

    resolveInitialText()
  }, [initialText, resolveAttachment])

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
    setFileName(file.name)

    // Check file type - be more permissive for text files
    const acceptedTypes = accept.split(',').map((t) => t.trim())
    const isAccepted = acceptedTypes.some((type) => {
      if (type.startsWith('.')) {
        return file.name.toLowerCase().endsWith(type.toLowerCase())
      }
      return file.type.includes(type) || file.type === ''
    })

    if (!isAccepted && file.type !== '') {
      setError(`Please upload a text file (${accept})`)
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
        // First read the file to get preview
        const textContent = await readFileAsText(file)
        if (showPreview) {
          const previewText =
            textContent.length > 500 ? textContent.substring(0, 500) + '...' : textContent
          setTextPreview(previewText)
        }
        setShowTextPreview(true)

        // Then upload
        const filename = customFilename || file.name
        const result = await uploadToVOSpace(file, filename)

        if (result.success && result.fileReference) {
          setHasFile(true)
          setCurrentFileRef(result.fileReference)
          onFileLoaded(result.fileReference)
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

    // Legacy mode: store text content inline
    setIsLoading(true)
    try {
      const textContent = await readFileAsText(file)
      setHasFile(true)
      setCurrentFileRef(null)

      // Store the first 500 characters for preview
      if (showPreview) {
        const previewText =
          textContent.length > 500 ? textContent.substring(0, 500) + '...' : textContent
        setTextPreview(previewText)
      }

      // Pass the full text content to the parent
      onFileLoaded(textContent)
      setShowTextPreview(true)
    } catch (err) {
      console.error(err)
      setError('Error processing text file')
    } finally {
      setIsLoading(false)
    }
  }

  // Helper to read file as text
  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => resolve(e.target?.result as string)
      reader.onerror = () => reject(new Error('Error reading file'))
      reader.readAsText(file)
    })
  }

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
  }

  const handleClick = () => {
    if (!hasFile && fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const handleClear = async () => {
    // If we have a FileReference and doiIdentifier, delete from VOSpace
    if (currentFileRef && doiIdentifier) {
      try {
        await deleteFile(currentFileRef.filename)
      } catch (err) {
        console.error('[TextFileUpload] Failed to delete from VOSpace:', err)
        // Continue with UI clear even if delete fails
      }
    }

    setError(null)
    setFileName('')
    setHasFile(false)
    setTextPreview('')
    setShowTextPreview(false)
    setCurrentFileRef(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    onClear()
  }

  const togglePreview = () => {
    setShowTextPreview(!showTextPreview)
  }

  // Combine loading states
  const showLoading = isLoading || isUploading
  const displayError = error || uploadError

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
        data-testid="text-file-input"
      />

      {!hasFile ? (
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
              <FileText size={40} color="#9e9e9e" />
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
              {useVOSpaceUpload ? (
                <Upload size={40} color="#9e9e9e" />
              ) : (
                <FileText size={40} color="#9e9e9e" />
              )}
              <Typography variant="body1" sx={{ mt: 2 }}>
                {hint}
              </Typography>
              <Button variant="contained" sx={{ mt: 2 }} startIcon={<Upload size={16} />}>
                Browse Files
              </Button>
            </>
          )}
        </Box>
      ) : (
        <Box sx={{ position: 'relative' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '60px',
                height: '60px',
                bgcolor: 'background.paper',
                borderRadius: '4px',
                border: '1px solid #e0e0e0',
                position: 'relative',
              }}
            >
              <FileText size={28} color="#616161" />
              {currentFileRef && (
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: -6,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    bgcolor: 'primary.main',
                    color: 'white',
                    px: 0.5,
                    py: 0.25,
                    borderRadius: 0.5,
                    fontSize: '0.6rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.25,
                  }}
                >
                  <Cloud size={8} />
                  Stored
                </Box>
              )}
            </Box>
            <Typography variant="body1" fontWeight="medium">
              {fileName || 'Text file loaded'}
            </Typography>
            <Box sx={{ ml: 'auto', display: 'flex', gap: 1 }}>
              {showPreview && textPreview && (
                <IconButton
                  size="small"
                  onClick={togglePreview}
                  sx={{
                    bgcolor: 'background.paper',
                    border: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  {showTextPreview ? <EyeOff size={16} /> : <Eye size={16} />}
                </IconButton>
              )}
              <IconButton
                size="small"
                sx={{
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
          </Box>

          {/* Using the extracted TextPreview component */}
          {showPreview && textPreview && showTextPreview && <TextPreview text={textPreview} />}
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

export default TextFileUpload
