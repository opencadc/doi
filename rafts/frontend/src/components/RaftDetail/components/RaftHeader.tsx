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

import { Box, Typography, Chip, Button, Tooltip, CircularProgress } from '@mui/material'
import {
  Calendar,
  User,
  Clock,
  Tag,
  Download,
  Share2,
  Pencil,
  Trash2,
  SendHorizontal,
  UserCheck,
  Undo2,
} from 'lucide-react'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

// Extend dayjs with the relativeTime plugin
dayjs.extend(relativeTime)
import StatusBadge from '@/components/common/StatusBadge'
import { RaftData } from '@/types/doi'
import DOILinks from '@/components/RaftDetail/components/DOILinks'

interface RaftHeaderProps {
  raftData: Partial<RaftData>
  isEditable: boolean
  isDeletable: boolean
  canSubmitForReview?: boolean
  isSubmittingForReview?: boolean
  canRevertToDraft?: boolean
  isRevertingToDraft?: boolean
  onDownload?: () => void
  onShare?: () => void
  onEdit?: () => void
  onDelete?: () => void
  onSubmitForReview?: () => void
  onRevertToDraft?: () => void
}

export default function RaftHeader({
  raftData,
  isEditable,
  isDeletable,
  canSubmitForReview = false,
  isSubmittingForReview = false,
  canRevertToDraft = false,
  isRevertingToDraft = false,
  onDownload,
  onShare,
  onEdit,
  onDelete,
  onSubmitForReview,
  onRevertToDraft,
}: RaftHeaderProps) {
  const {
    authorInfo,
    observationInfo,
    createdAt,
    updatedAt,
    createdBy,
    doi,
    generalInfo,
    reviewer,
    version,
  } = raftData
  const status = generalInfo?.status
  const title = generalInfo?.title

  return (
    <Box
      sx={{
        p: { xs: 2, sm: 3 },
        bgcolor: 'primary.50',
        borderBottom: '1px solid',
        borderColor: 'divider',
      }}
    >
      {/* Desktop: side-by-side layout, Mobile: stacked */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'stretch', md: 'flex-start' },
          gap: 2,
        }}
      >
        {/* Main content section */}
        <Box sx={{ flex: 1 }}>
          {observationInfo?.topic && observationInfo.topic.length > 0 && (
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
              {observationInfo.topic.map((top) => (
                <Chip
                  key={top}
                  icon={<Tag size={14} />}
                  label={top.replace(/_/g, ' ')}
                  size="small"
                  color="secondary"
                  variant="outlined"
                  sx={{ textTransform: 'capitalize' }}
                />
              ))}
            </Box>
          )}

          <Typography variant="h4" gutterBottom sx={{ fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>
            {title || 'Untitled RAFTS'}
          </Typography>

          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
            <StatusBadge status={status} />

            {version && version > 0 && (
              <Chip label={`v${version}`} size="small" variant="outlined" />
            )}

            {reviewer && (
              <Chip
                icon={<UserCheck size={14} />}
                label={`Reviewer: ${reviewer}`}
                size="small"
                color="primary"
                variant="outlined"
              />
            )}
          </Box>

          <Box
            sx={{
              display: 'flex',
              gap: { xs: 1, sm: 3 },
              mt: 2,
              flexWrap: 'wrap',
              flexDirection: { xs: 'column', sm: 'row' },
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Calendar size={16} />
              <Typography variant="body2">{dayjs(createdAt).format('MMM D, YYYY')}</Typography>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <User size={16} />
              <Typography variant="body2">
                {authorInfo?.correspondingAuthor
                  ? `${authorInfo.correspondingAuthor.firstName} ${authorInfo.correspondingAuthor.lastName}`
                  : createdBy || 'Unknown'}
              </Typography>
            </Box>

            {createdBy && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Created by: {createdBy}
                </Typography>
              </Box>
            )}

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Clock size={16} />
              <Typography variant="body2">
                Updated {dayjs(updatedAt).format('MMM D, YYYY')}
              </Typography>
            </Box>
          </Box>
          {doi && <DOILinks doi={doi} />}
        </Box>

        {/* Action buttons - below on mobile, right side on desktop */}
        <Box
          sx={{
            display: 'flex',
            gap: 1,
            flexWrap: 'wrap',
            flexShrink: 0,
            pt: { xs: 2, md: 0 },
            borderTop: { xs: '1px solid', md: 'none' },
            borderColor: 'divider',
          }}
        >
          {canRevertToDraft && (
            <Tooltip title="Revert to Draft">
              <Button
                variant="outlined"
                size="small"
                color="warning"
                startIcon={
                  isRevertingToDraft ? (
                    <CircularProgress size={18} color="inherit" />
                  ) : (
                    <Undo2 size={18} />
                  )
                }
                onClick={onRevertToDraft}
                disabled={isRevertingToDraft}
                sx={{
                  flexGrow: { xs: 1, md: 0 },
                  minWidth: { xs: 'calc(50% - 4px)', md: 'auto' },
                }}
              >
                {isRevertingToDraft ? 'Reverting...' : 'Revert to Draft'}
              </Button>
            </Tooltip>
          )}

          <Tooltip title="Download RAFTS">
            <Button
              variant="outlined"
              size="small"
              startIcon={<Download size={18} />}
              onClick={onDownload}
              disabled
              sx={{ flexGrow: { xs: 1, md: 0 }, minWidth: { xs: 'calc(50% - 4px)', md: 'auto' } }}
            >
              Download
            </Button>
          </Tooltip>

          <Tooltip title="Share RAFTS">
            <Button
              variant="outlined"
              size="small"
              startIcon={<Share2 size={18} />}
              onClick={onShare}
              disabled
              sx={{ flexGrow: { xs: 1, md: 0 }, minWidth: { xs: 'calc(50% - 4px)', md: 'auto' } }}
            >
              Share
            </Button>
          </Tooltip>

          {isEditable && (
            <Tooltip title="Edit RAFTS">
              <Button
                variant="outlined"
                size="small"
                startIcon={<Pencil size={18} />}
                onClick={onEdit}
                sx={{
                  flexGrow: { xs: 1, md: 0 },
                  minWidth: { xs: 'calc(50% - 4px)', md: 'auto' },
                }}
              >
                Edit
              </Button>
            </Tooltip>
          )}

          {canSubmitForReview && (
            <Tooltip title="Submit for Review">
              <Button
                variant="contained"
                size="small"
                color="primary"
                startIcon={
                  isSubmittingForReview ? (
                    <CircularProgress size={18} color="inherit" />
                  ) : (
                    <SendHorizontal size={18} />
                  )
                }
                onClick={onSubmitForReview}
                disabled={isSubmittingForReview}
                sx={{
                  flexGrow: { xs: 1, md: 0 },
                  minWidth: { xs: 'calc(50% - 4px)', md: 'auto' },
                }}
              >
                {isSubmittingForReview ? 'Submitting...' : 'Review Ready'}
              </Button>
            </Tooltip>
          )}

          {isDeletable && (
            <Tooltip title="Delete RAFTS">
              <Button
                variant="outlined"
                size="small"
                color="error"
                startIcon={<Trash2 size={18} />}
                onClick={onDelete}
                sx={{
                  flexGrow: { xs: 1, md: 0 },
                  minWidth: { xs: 'calc(50% - 4px)', md: 'auto' },
                }}
              >
                Delete
              </Button>
            </Tooltip>
          )}
        </Box>
      </Box>
    </Box>
  )
}
