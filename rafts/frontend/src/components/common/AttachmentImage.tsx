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
import { Box, CircularProgress, IconButton, useTheme } from '@mui/material'
import { Eye } from 'lucide-react'
import ImageComponent from 'next/image'
import {
  parseStoredAttachment,
  isFileReference,
  isBase64DataUrl,
  AttachmentValue,
} from '@/types/attachments'
import AttachmentPreviewModal from './AttachmentPreviewModal'

interface AttachmentImageProps {
  /** The attachment value - can be base64 string, FileReference JSON, or direct URL */
  value: AttachmentValue | string | undefined | null
  /** DOI identifier for resolving FileReference attachments */
  doiId?: string
  /** Alt text for the image */
  alt?: string
  /** Width of the image */
  width?: number
  /** Height of the image */
  height?: number
  /** Additional styles */
  style?: React.CSSProperties
  /** Title for the preview modal */
  previewTitle?: string
  /** Whether to show the preview button */
  showPreview?: boolean
}

/**
 * Reusable component for displaying attachment images.
 *
 * Handles:
 * - Base64 data URLs (displayed directly)
 * - FileReference objects (resolved via API route)
 * - Direct URLs (displayed directly)
 *
 * Shows a loading spinner while images are being fetched from API.
 */
export default function AttachmentImage({
  value,
  doiId,
  alt = 'Attachment',
  width = 100,
  height = 100,
  style,
  previewTitle = 'Image Preview',
  showPreview = true,
}: AttachmentImageProps) {
  const theme = useTheme()
  const [isLoading, setIsLoading] = useState(false)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const lastResolvedRef = useRef<string | null>(null)

  // Default styles
  const defaultStyle: React.CSSProperties = {
    width: `${width}px`,
    height: `${height}px`,
    objectFit: 'cover',
    borderRadius: '4px',
    border: `1px solid ${theme.palette.divider}`,
    ...style,
  }

  // Resolve the image URL from the value
  useEffect(() => {
    if (!value) {
      setImageUrl(null)
      setIsLoading(false)
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
      // It's a FileReference - use API route
      const apiUrl = `/api/attachments/${doiId}/${encodeURIComponent(parsed.filename)}`
      setImageUrl(apiUrl)
      setIsLoading(true) // Start loading - will be set to false by onLoad/onError
      lastResolvedRef.current = valueKey
    } else if (typeof value === 'string') {
      // It's a base64 string or direct URL
      if (isBase64DataUrl(value) || value.startsWith('http') || value.startsWith('/')) {
        setImageUrl(value)
        setIsLoading(false)
        lastResolvedRef.current = valueKey
      }
    }
  }, [value, doiId])

  // No value - don't render anything
  if (!value || !imageUrl) {
    return null
  }

  const isApiRoute = imageUrl.startsWith('/api/')

  return (
    <>
      <Box
        sx={{
          position: 'relative',
          width: `${width}px`,
          height: `${height}px`,
          minWidth: `${width}px`,
          minHeight: `${height}px`,
        }}
      >
        {/* Loading spinner overlay */}
        {isLoading && (
          <Box
            sx={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '4px',
              border: `1px solid ${theme.palette.divider}`,
              bgcolor: 'action.hover',
              position: 'absolute',
              top: 0,
              left: 0,
              zIndex: 1,
            }}
          >
            <CircularProgress size={24} />
          </Box>
        )}

        {/* Use regular img for API routes, Next.js Image for base64/external URLs */}
        {isApiRoute ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={alt}
            style={{
              ...defaultStyle,
              visibility: isLoading ? 'hidden' : 'visible',
              cursor: showPreview ? 'pointer' : 'default',
            }}
            onLoad={() => setIsLoading(false)}
            onError={() => setIsLoading(false)}
            onClick={showPreview ? () => setPreviewOpen(true) : undefined}
          />
        ) : (
          <ImageComponent
            src={imageUrl}
            alt={alt}
            style={{
              ...defaultStyle,
              visibility: isLoading ? 'hidden' : 'visible',
              cursor: showPreview ? 'pointer' : 'default',
            }}
            width={width}
            height={height}
            onLoad={() => setIsLoading(false)}
            onClick={showPreview ? () => setPreviewOpen(true) : undefined}
          />
        )}

        {/* Preview button */}
        {showPreview && !isLoading && (
          <IconButton
            size="small"
            onClick={() => setPreviewOpen(true)}
            sx={{
              position: 'absolute',
              top: -8,
              right: -8,
              bgcolor: 'background.paper',
              border: `1px solid ${theme.palette.divider}`,
              boxShadow: 1,
              '&:hover': {
                bgcolor: 'primary.main',
                color: 'white',
              },
            }}
            aria-label="Preview image"
          >
            <Eye size={14} />
          </IconButton>
        )}
      </Box>

      {/* Preview Modal */}
      <AttachmentPreviewModal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title={previewTitle}
        type="image"
        imageUrl={imageUrl || undefined}
        isLoading={isLoading}
      />
    </>
  )
}
