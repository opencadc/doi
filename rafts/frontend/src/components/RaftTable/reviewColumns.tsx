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
import { ColumnDef } from '@tanstack/react-table'
import type { RaftData } from '@/types/doi'
import StatusBadge from '@/components/common/StatusBadge'
import { Typography, Tooltip, Chip, Box } from '@mui/material'
import { TRaftStatus } from '@/shared/model'
import SubmitterDetailsCell from './SubmitterDetailsCell'
import ActionsCell from './ActionsCell'
import { BACKEND_STATUS } from '@/shared/backendStatus'

/**
 * Defines the columns configuration for the RAFT review table
 *
 * @param currentStatus - Current filter status to determine which actions to show
 * @param onStatusUpdate - Callback function when a status is updated
 * @returns Array of column definitions for the table
 */
export const reviewColumns = (
  currentStatus?: string,
  onStatusUpdate?: () => void,
): ColumnDef<RaftData>[] => [
  {
    accessorKey: '_id',
    header: 'ID',
    cell: ({ row }) => {
      const id = row.getValue('_id') as string
      return (
        <Typography variant="body2" sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>
          {id.substring(0, 8)}...
        </Typography>
      )
    },
  },
  {
    accessorKey: 'authorInfo.title',
    header: 'Title',
    cell: ({ row }) => {
      const raft = row.original
      return (
        <Tooltip title={raft.generalInfo?.title || ''}>
          <Typography className="font-medium" noWrap sx={{ maxWidth: 250 }}>
            {raft.generalInfo?.title || 'No title'}
          </Typography>
        </Tooltip>
      )
    },
  },
  {
    accessorKey: 'authorInfo.correspondingAuthor.lastName',
    header: 'Submitter',
    cell: ({ row }) => {
      const raft = row.original
      return <SubmitterDetailsCell author={raft.authorInfo?.correspondingAuthor} />
    },
  },
  {
    accessorKey: 'observationInfo.topic',
    header: 'Topic',
    cell: ({ row }) => {
      const topic = row.original.observationInfo?.topic
      return (
        <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
          {topic ? topic?.map?.((t) => t.replace(/_/g, ' ')).join(', ') : 'Not specified'}
        </Typography>
      )
    },
  },
  {
    accessorKey: 'generalInfo.status',
    header: 'Status',
    cell: ({ row }) => {
      const raft = row.original
      const status = raft.generalInfo?.status as TRaftStatus
      const isResubmission =
        raft.statusHistory?.some(
          (h) =>
            h.toStatus === BACKEND_STATUS.IN_PROGRESS &&
            (raft.statusHistory?.findIndex((s) => s === h) ?? 0) > 0,
        ) ?? false
      return (
        <Box>
          <StatusBadge status={status} />
          {isResubmission && (
            <Chip
              label="Resubmission"
              size="small"
              sx={{
                mt: 0.5,
                fontSize: '0.65rem',
                height: 18,
                bgcolor: 'info.light',
                color: 'info.contrastText',
              }}
            />
          )}
        </Box>
      )
    },
  },
  {
    accessorKey: 'submittedAt',
    header: 'Submitted',
    cell: ({ row }) => {
      const raft = row.original
      const dateStr = raft.submittedAt
      if (!dateStr) {
        return (
          <Typography variant="body2" color="text.secondary">
            N/A
          </Typography>
        )
      }
      const date = new Date(dateStr)
      return (
        <Typography variant="body2">
          {date.toLocaleDateString()}
          <Typography variant="caption" display="block" color="text.secondary">
            {date.toLocaleTimeString()}
          </Typography>
          {raft.version && raft.version > 1 && (
            <Typography variant="caption" display="block" color="warning.main">
              v{raft.version}
            </Typography>
          )}
        </Typography>
      )
    },
  },
  {
    id: 'actions',
    header: 'Actions',
    cell: ({ row }) => (
      <ActionsCell
        raft={row.original}
        currentStatus={currentStatus}
        onStatusUpdate={onStatusUpdate}
      />
    ),
  },
]
