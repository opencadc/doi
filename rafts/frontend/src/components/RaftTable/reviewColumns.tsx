'use client'

import React from 'react'
import { ColumnDef } from '@tanstack/react-table'
import type { RaftData } from '@/types/doi'
import StatusBadge from './StatusBadge'
import { Typography, Tooltip } from '@mui/material'
import { TRaftStatus } from '@/shared/model'
import SubmitterDetailsCell from './SubmitterDetailsCell'
import ActionsCell from './ActionsCell'

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
      const status = row.original.generalInfo?.status as TRaftStatus
      return <StatusBadge status={status} />
    },
  },
  {
    accessorKey: 'createdAt',
    header: 'Submitted',
    cell: ({ row }) => {
      const date = new Date(row.getValue('createdAt') as string)
      return (
        <Typography variant="body2">
          {date.toLocaleDateString()}
          <Typography variant="caption" display="block" color="text.secondary">
            {date.toLocaleTimeString()}
          </Typography>
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
