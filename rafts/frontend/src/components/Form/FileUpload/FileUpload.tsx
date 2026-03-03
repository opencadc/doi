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

import React, { useState, useRef, ChangeEvent } from 'react'
import { Button, Box, Typography, CircularProgress, Alert, Paper, Chip } from '@mui/material'
import { Upload, FileText, X, Check, AlertTriangle } from 'lucide-react'
import { TRaftContext } from '@/context/types'

interface FileUploadProps {
  onFileLoaded: (data: TRaftContext) => void
  onError?: (error: string) => void
  accept?: string
  maxSize?: number // in bytes
  label?: string
  hint?: string
  showPreview?: boolean
}

/**
 * Component for handling JSON file uploads in forms
 */
const FileUpload: React.FC<FileUploadProps> = ({
  onFileLoaded,
  onError,
  accept = '.json',
  maxSize = 5 * 1024 * 1024, // 5MB default
  label = 'Upload JSON File',
  hint = 'Select or drag & drop a JSON file',
  showPreview = true,
}) => {
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [fileName, setFileName] = useState<string>('')
  const [fileSize, setFileSize] = useState<number>(0)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<boolean>(false)
  const [preview, setPreview] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

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

  const processFile = (file: File) => {
    // Reset states
    setError(null)
    setSuccess(false)
    setPreview(null)

    // Check file type
    if (!file.name.endsWith('.json') && !file.type.includes('application/json')) {
      const errorMsg = 'Please upload a JSON file'
      setError(errorMsg)
      if (onError) onError(errorMsg)
      return
    }

    // Check file size
    if (file.size > maxSize) {
      const errorMsg = `File is too large. Maximum size is ${maxSize / 1024 / 1024}MB`
      setError(errorMsg)
      if (onError) onError(errorMsg)
      return
    }

    setIsLoading(true)
    setFileName(file.name)
    setFileSize(file.size)

    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const content = e.target?.result as string
        const parsedData = JSON.parse(content)

        // Generate preview
        if (showPreview) {
          setPreview(
            JSON.stringify(parsedData, null, 2).substring(0, 500) +
              (JSON.stringify(parsedData, null, 2).length > 500 ? '...' : ''),
          )
        }

        onFileLoaded(parsedData)
        setSuccess(true)
      } catch {
        const errorMsg = 'Invalid JSON format'
        setError(errorMsg)
        if (onError) onError(errorMsg)
      } finally {
        setIsLoading(false)
      }
    }

    reader.onerror = () => {
      const errorMsg = 'Error reading file'
      setError(errorMsg)
      if (onError) onError(errorMsg)
      setIsLoading(false)
    }

    reader.readAsText(file)
  }

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
  }

  const handleClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const handleClear = () => {
    setFileName('')
    setFileSize(0)
    setError(null)
    setSuccess(false)
    setPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <Box sx={{ width: '100%', mb: 2 }}>
      <Typography variant="subtitle1" sx={{ mb: 1 }}>
        {label}
      </Typography>

      <input
        type="file"
        ref={fileInputRef}
        accept={accept}
        onChange={handleFileChange}
        style={{ display: 'none' }}
        data-testid="json-file-input"
      />

      <Box
        sx={{
          border: '2px dashed',
          borderColor: error ? 'error.main' : success ? 'success.main' : 'divider',
          borderRadius: 1,
          p: 3,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'background.paper',
          cursor: 'pointer',
          transition: 'border-color 0.3s ease',
          '&:hover': {
            borderColor: 'primary.main',
          },
        }}
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        {isLoading ? (
          <CircularProgress size={40} />
        ) : (
          <>
            {fileName ? (
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  width: '100%',
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    mb: 1,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <FileText size={24} className="mr-2" />
                    <Typography variant="body1" sx={{ ml: 1 }}>
                      {fileName}
                    </Typography>
                  </Box>
                  <Box>
                    <Chip
                      label={`${(fileSize / 1024).toFixed(1)} KB`}
                      size="small"
                      sx={{ mr: 1 }}
                    />
                    <Button
                      size="small"
                      color="error"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleClear()
                      }}
                    >
                      <X size={16} />
                    </Button>
                  </Box>
                </Box>

                {success && (
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      color: 'success.main',
                      mt: 1,
                    }}
                  >
                    <Check size={16} />
                    <Typography variant="body2" sx={{ ml: 0.5 }}>
                      File loaded successfully
                    </Typography>
                  </Box>
                )}
              </Box>
            ) : (
              <>
                <Upload size={40} color="#9e9e9e" />
                <Typography variant="body1" sx={{ mt: 2 }}>
                  {hint}
                </Typography>
                <Button variant="contained" sx={{ mt: 2 }}>
                  Browse Files
                </Button>
              </>
            )}
          </>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      {preview && !error && (
        <Paper
          elevation={0}
          sx={{
            mt: 2,
            p: 2,
            bgcolor: 'grey.100',
            maxHeight: '200px',
            overflow: 'auto',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1,
            fontSize: '0.875rem',
            fontFamily: 'monospace',
          }}
        >
          <Typography variant="subtitle2" sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
            <AlertTriangle size={16} className="mr-2" /> Preview (truncated)
          </Typography>
          <pre style={{ margin: 0 }}>{preview}</pre>
        </Paper>
      )}
    </Box>
  )
}

export default FileUpload
