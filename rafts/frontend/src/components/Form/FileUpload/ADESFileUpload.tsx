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
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  SelectChangeEvent,
  useTheme,
  LinearProgress,
} from '@mui/material'
import { FileText, X, Eye, EyeOff, Upload, Cloud } from 'lucide-react'
import TextPreview from './TextPreview'
import { useADESValidation } from '@/hooks/useADESValidation'
import type { ADESFileKind } from '@/actions/adesValidation.types'
import { useAttachmentUpload } from '@/hooks/useAttachmentUpload'
import {
  FileReference,
  AttachmentValue,
  isFileReference,
  ATTACHMENT_CONFIGS,
} from '@/types/attachments'

const FILE_TYPE_LABELS: Record<ADESFileKind, string> = {
  xml: 'XML (.xml)',
  psv: 'Pipe Separated Values (.psv)',
  mpc: 'Minor Planet Center (.mpc)',
}

const ACCEPTED: Record<ADESFileKind, string> = {
  xml: '.xml,text/xml,application/xml',
  psv: '.psv,text/plain',
  mpc: '.mpc,text/plain,application/octet-stream',
}

export interface ADESFileUploadProps {
  /** Callback when file is cleared */
  onClear: () => void
  /** Callback when file is uploaded - receives text content or FileReference */
  onFileUpload?: (data: string | FileReference) => void
  /** Initial text value - can be text string or FileReference */
  initialText?: AttachmentValue
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
}

/**
 * Component for handling ADES file uploads (XML/PSV/MPC) with validation
 *
 * Supports two modes:
 * 1. Legacy mode (no doiIdentifier): Stores text content inline
 * 2. VOSpace mode (with doiIdentifier): Uploads to VOSpace and returns FileReference
 */
const ADESFileUpload: React.FC<ADESFileUploadProps> = ({
  onClear,
  onFileUpload,
  initialText = '',
  maxSize = 5 * 1024 * 1024,
  label = 'Upload ADES File',
  hint = 'Select XML, PSV, or MPC file',
  showPreview = true,
  doiIdentifier,
  customFilename,
}) => {
  const theme = useTheme()
  const [fileKind, setFileKind] = useState<ADESFileKind>('xml')
  const [fileName, setFileName] = useState<string>('')
  const [fileSizeError, setFileSizeError] = useState<string>('')
  const [textPreview, setTextPreview] = useState<string>('')
  const [showTextPreview, setShowTextPreview] = useState<boolean>(false)
  const [hasFile, setHasFile] = useState<boolean>(false)
  const [currentFileRef, setCurrentFileRef] = useState<FileReference | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Use our custom validation hook
  const { isValidating, validationResult, validationError, validateFile, resetValidation } =
    useADESValidation()

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
    config: ATTACHMENT_CONFIGS.astrometry,
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
          setTextPreview(resolved.length > 500 ? resolved.substring(0, 500) + '...' : resolved)
          setShowTextPreview(true)
        }
      } else if (typeof initialText === 'string' && initialText.length > 0) {
        // It's inline text content
        setHasFile(true)
        setCurrentFileRef(null)
        setTextPreview(
          initialText.length > 500 ? initialText.substring(0, 500) + '...' : initialText,
        )
        setShowTextPreview(true)
      }
    }

    resolveInitialText()
  }, [initialText, resolveAttachment])

  const handleFileKindChange = (event: SelectChangeEvent<ADESFileKind>) => {
    setFileKind(event.target.value as ADESFileKind)
    resetValidation()
  }

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files && files.length > 0) {
      readAndUpload(files[0])
    }
    if (event.target) event.target.value = ''
  }

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
      readAndUpload(event.dataTransfer.files[0])
    }
  }

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
  }

  const readAndUpload = (file: File) => {
    resetValidation()
    setFileSizeError('')
    setFileName(file.name)

    if (file.size > maxSize) {
      setFileSizeError(`File too large (max ${(maxSize / 1024 / 1024).toFixed(2)} MB)`)
      return
    }

    const reader = new FileReader()
    reader.onload = (e: ProgressEvent<FileReader>) => {
      const fileText = e.target?.result as string
      if (showPreview) {
        setTextPreview(fileText.length > 500 ? fileText.substring(0, 500) + '...' : fileText)
      }
      setShowTextPreview(true)
      uploadAndValidateFile(file, fileText)
    }
    reader.onerror = () => {
      resetValidation()
    }
    reader.readAsText(file)
  }

  const uploadAndValidateFile = async (file: File, fileText: string) => {
    try {
      // Use our validation hook with direct result access
      const { success, result } = await validateFile(file, fileKind)

      // Check validation success and result
      if (
        success &&
        result &&
        Array.isArray(result.results) &&
        result.results.length > 0 &&
        result.results.every((r) => r.valid)
      ) {
        setHasFile(true)

        // If VOSpace upload is enabled, upload to VOSpace
        if (useVOSpaceUpload) {
          const filename = customFilename || `astrometry.${fileKind}`
          const uploadResult = await uploadToVOSpace(file, filename)

          if (uploadResult.success && uploadResult.fileReference) {
            setCurrentFileRef(uploadResult.fileReference)
            if (onFileUpload) {
              onFileUpload(uploadResult.fileReference)
            }
          }
        } else {
          // Legacy mode: pass text content
          setCurrentFileRef(null)
          if (onFileUpload) {
            onFileUpload(fileText)
          }
        }
      }
    } catch (err) {
      console.error('Error during validation:', err)
    }
  }

  const handleClear = async () => {
    // If we have a FileReference and doiIdentifier, delete from VOSpace
    if (currentFileRef && doiIdentifier) {
      try {
        await deleteFile(currentFileRef.filename)
      } catch (err) {
        console.error('[ADESFileUpload] Failed to delete from VOSpace:', err)
        // Continue with UI clear even if delete fails
      }
    }

    resetValidation()
    setFileName('')
    setTextPreview('')
    setShowTextPreview(false)
    setHasFile(false)
    setCurrentFileRef(null)
    setFileSizeError('')
    if (fileInputRef.current) fileInputRef.current.value = ''
    onClear()
  }

  const togglePreview = () => setShowTextPreview((prev) => !prev)

  // Combine loading states
  const showLoading = isValidating || isUploading
  const displayError = validationError || uploadError || fileSizeError

  return (
    <Box sx={{ width: '100%', mb: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <Typography variant="subtitle1">{label}</Typography>
        {useVOSpaceUpload && (
          <Box component="span" title="Uploads to cloud storage" sx={{ display: 'flex' }}>
            <Cloud size={16} color="#1976d2" />
          </Box>
        )}
      </Box>
      <FormControl sx={{ mb: 2, minWidth: 180 }}>
        <InputLabel id="ades-file-kind-label">File Type</InputLabel>
        <Select
          labelId="ades-file-kind-label"
          value={fileKind}
          label="File Type"
          onChange={handleFileKindChange}
        >
          <MenuItem value="xml">{FILE_TYPE_LABELS.xml}</MenuItem>
          <MenuItem value="psv">{FILE_TYPE_LABELS.psv}</MenuItem>
          <MenuItem value="mpc">{FILE_TYPE_LABELS.mpc}</MenuItem>
        </Select>
      </FormControl>
      <input
        type="file"
        ref={fileInputRef}
        accept={ACCEPTED[fileKind]}
        onChange={handleFileChange}
        style={{ display: 'none' }}
        data-testid="ades-file-input"
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
            '&:hover': { borderColor: showLoading || !doiIdentifier ? undefined : 'primary.main' },
          }}
          onClick={showLoading || !doiIdentifier ? undefined : () => fileInputRef.current?.click()}
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
              {isValidating && (
                <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
                  Validating file...
                </Typography>
              )}
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
              {fileName}
            </Typography>
            <Box sx={{ ml: 'auto', display: 'flex', gap: 1 }}>
              {showPreview && textPreview && (
                <IconButton
                  size="small"
                  onClick={togglePreview}
                  sx={{ border: '1px solid', borderColor: 'divider' }}
                >
                  {showTextPreview ? <EyeOff size={16} /> : <Eye size={16} />}
                </IconButton>
              )}
              <IconButton
                size="small"
                onClick={handleClear}
                disabled={showLoading}
                sx={{
                  border: '1px solid',
                  borderColor: 'divider',
                  '&:hover': { bgcolor: 'error.light', color: 'white' },
                }}
              >
                <X size={16} />
              </IconButton>
            </Box>
          </Box>
          {showPreview && textPreview && showTextPreview && <TextPreview text={textPreview} />}
        </Box>
      )}

      {displayError && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {displayError}
        </Alert>
      )}

      {validationResult && (
        <Box sx={{ mt: 2, p: 2, borderRadius: 1, bgcolor: 'background.paper', boxShadow: 1 }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Validation result for <b>{validationResult.filename}</b>
          </Typography>
          {validationResult.xml_info && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2">
                <b>Root element:</b> {validationResult.xml_info.root_element}
                <br />
                <b>Version:</b> {validationResult.xml_info.version}
              </Typography>
              {validationResult.xml_info.attributes && (
                <Typography variant="body2">
                  <b>Attributes:</b>{' '}
                  {Object.entries(validationResult.xml_info.attributes)
                    .map(([k, v]) => `${k}="${v}"`)
                    .join(', ')}
                </Typography>
              )}
            </Box>
          )}
          {validationResult.results && (
            <Box component="ul" sx={{ pl: 2, mb: 1 }}>
              {validationResult.results.map((res, i) => (
                <li key={i}>
                  <Typography variant="body2">
                    <b>Type:</b> {res.type} | <b>Status:</b>{' '}
                    <span
                      style={{
                        color: res.valid ? theme.palette.success.main : theme.palette.error.main,
                      }}
                    >
                      {res.valid ? 'Valid' : 'Invalid'}
                    </span>
                    <br />
                    <b>Message:</b> <span style={{ whiteSpace: 'pre-line' }}>{res.message}</span>
                  </Typography>
                </li>
              ))}
            </Box>
          )}
        </Box>
      )}
    </Box>
  )
}

export default ADESFileUpload
