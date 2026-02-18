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

'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Box, CircularProgress, IconButton, Paper, Typography, useTheme } from '@mui/material'
import { Eye } from 'lucide-react'
import { parseStoredAttachment, isFileReference, AttachmentValue } from '@/types/attachments'
import AttachmentPreviewModal from './AttachmentPreviewModal'

interface AttachmentTextProps {
  /** The attachment value - can be plain text string or FileReference JSON */
  value: AttachmentValue | string | undefined | null
  /** DOI identifier for resolving FileReference attachments */
  doiId?: string
  /** Maximum height of the preview area */
  maxHeight?: string | number
  /** Show "Preview:" label */
  showLabel?: boolean
  /** Title for the preview modal */
  previewTitle?: string
  /** Whether to show the preview button */
  showPreview?: boolean
}

/**
 * Reusable component for displaying text file attachments.
 *
 * Handles:
 * - Plain text strings (displayed directly)
 * - FileReference objects (fetched from API and displayed)
 *
 * Shows a loading spinner while text is being fetched from API.
 */
export default function AttachmentText({
  value,
  doiId,
  maxHeight = '200px',
  showLabel = true,
  previewTitle = 'Text Preview',
  showPreview = true,
}: AttachmentTextProps) {
  const theme = useTheme()
  const [isLoading, setIsLoading] = useState(false)
  const [textContent, setTextContent] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const lastResolvedRef = useRef<string | null>(null)

  // Resolve the text content from the value
  useEffect(() => {
    if (!value) {
      setTextContent(null)
      setIsLoading(false)
      setError(null)
      lastResolvedRef.current = null
      return
    }

    // Create a stable key for comparison
    const valueKey =
      typeof value === 'string'
        ? `str:${value.substring(0, 50)}`
        : isFileReference(value)
          ? `ref:${value.filename}`
          : null

    // Skip if we've already resolved this exact value
    if (valueKey && lastResolvedRef.current === valueKey) {
      return
    }

    // Try to parse as FileReference
    const parsed = typeof value === 'string' ? parseStoredAttachment(value) : value

    if (isFileReference(parsed) && doiId) {
      // It's a FileReference - fetch from API
      setIsLoading(true)
      setError(null)

      const apiUrl = `/api/attachments/${doiId}/${encodeURIComponent(parsed.filename)}`

      fetch(apiUrl)
        .then(async (response) => {
          if (!response.ok) {
            throw new Error(`Failed to fetch: ${response.status}`)
          }
          const text = await response.text()
          setTextContent(text)
          lastResolvedRef.current = valueKey
        })
        .catch((err) => {
          console.error('[AttachmentText] Failed to fetch text:', err)
          setError('Failed to load text content')
        })
        .finally(() => {
          setIsLoading(false)
        })
    } else if (typeof value === 'string') {
      // It's plain text - display directly
      setTextContent(value)
      setIsLoading(false)
      lastResolvedRef.current = valueKey
    }
  }, [value, doiId])

  // No value - don't render anything
  if (!value) {
    return null
  }

  return (
    <>
      <Paper
        elevation={0}
        sx={{
          p: 2,
          mt: 1,
          bgcolor:
            theme.palette.mode === 'dark' ? theme.palette.background.paper : theme.palette.grey[50],
          border: '1px solid',
          borderColor: theme.palette.divider,
          borderRadius: theme.shape.borderRadius,
          maxHeight,
          minHeight: '60px',
          overflow: 'auto',
          position: 'relative',
        }}
      >
        {/* Preview button */}
        {showPreview && !isLoading && textContent && (
          <IconButton
            size="small"
            onClick={() => setPreviewOpen(true)}
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              bgcolor: 'background.paper',
              border: `1px solid ${theme.palette.divider}`,
              boxShadow: 1,
              '&:hover': {
                bgcolor: 'primary.main',
                color: 'white',
              },
            }}
            aria-label="Preview text"
          >
            <Eye size={14} />
          </IconButton>
        )}

        {showLabel && (
          <Typography variant="subtitle2" gutterBottom>
            Preview:
          </Typography>
        )}

        {isLoading ? (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '40px',
            }}
          >
            <CircularProgress size={24} />
          </Box>
        ) : error ? (
          <Typography variant="body2" color="error">
            {error}
          </Typography>
        ) : textContent ? (
          <pre
            style={{
              margin: 0,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              fontFamily: 'monospace',
              fontSize: theme.typography.body2.fontSize,
              color: theme.palette.text.primary,
              overflowX: 'auto',
            }}
          >
            {textContent}
          </pre>
        ) : null}
      </Paper>

      {/* Preview Modal */}
      <AttachmentPreviewModal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title={previewTitle}
        type="text"
        textContent={textContent || undefined}
        isLoading={isLoading}
        error={error || undefined}
      />
    </>
  )
}
