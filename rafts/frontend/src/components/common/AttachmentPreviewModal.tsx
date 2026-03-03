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

import React from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Box,
  Typography,
  useTheme,
  CircularProgress,
} from '@mui/material'
import { X } from 'lucide-react'

interface AttachmentPreviewModalProps {
  open: boolean
  onClose: () => void
  title?: string
  type: 'image' | 'text'
  /** Image URL for image type */
  imageUrl?: string
  /** Text content for text type */
  textContent?: string
  /** Loading state */
  isLoading?: boolean
  /** Error message */
  error?: string
}

/**
 * Modal for previewing attachments (images or text files) in a larger view.
 * Takes 80% of the viewport.
 */
export default function AttachmentPreviewModal({
  open,
  onClose,
  title = 'Preview',
  type,
  imageUrl,
  textContent,
  isLoading = false,
  error,
}: AttachmentPreviewModalProps) {
  const theme = useTheme()

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={false}
      PaperProps={{
        sx: {
          width: '80vw',
          height: '80vh',
          maxWidth: '80vw',
          maxHeight: '80vh',
          m: 2,
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: `1px solid ${theme.palette.divider}`,
          py: 1.5,
        }}
      >
        <Typography variant="h6" component="span">
          {title}
        </Typography>
        <IconButton onClick={onClose} size="small" aria-label="Close preview">
          <X size={20} />
        </IconButton>
      </DialogTitle>

      <DialogContent
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 3,
          overflow: 'auto',
          bgcolor: type === 'image' ? theme.palette.grey[900] : theme.palette.background.paper,
        }}
      >
        {isLoading ? (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
            }}
          >
            <CircularProgress />
            <Typography variant="body2" color="text.secondary">
              Loading...
            </Typography>
          </Box>
        ) : error ? (
          <Typography variant="body1" color="error">
            {error}
          </Typography>
        ) : type === 'image' && imageUrl ? (
          <Box
            sx={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt={title}
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain',
                borderRadius: '4px',
              }}
            />
          </Box>
        ) : type === 'text' && textContent ? (
          <Box
            sx={{
              width: '100%',
              height: '100%',
              overflow: 'auto',
              bgcolor:
                theme.palette.mode === 'dark'
                  ? theme.palette.background.default
                  : theme.palette.grey[50],
              borderRadius: 1,
              p: 2,
            }}
          >
            <pre
              style={{
                margin: 0,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                fontFamily: 'monospace',
                fontSize: '14px',
                lineHeight: 1.6,
                color: theme.palette.text.primary,
              }}
            >
              {textContent}
            </pre>
          </Box>
        ) : (
          <Typography variant="body1" color="text.secondary">
            No content available
          </Typography>
        )}
      </DialogContent>
    </Dialog>
  )
}
