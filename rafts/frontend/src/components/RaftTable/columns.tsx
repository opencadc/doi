'use client'

import { ColumnDef } from '@tanstack/react-table'
import type { RaftData } from '@/types/doi'
import ActionMenu from './ActionMenu'
import StatusBadge from './StatusBadge'
import { Typography, Tooltip } from '@mui/material'
import dayjs from 'dayjs'
import { TRaftStatus } from '@/shared/model'

// Define table columns
export const columns: ColumnDef<RaftData>[] = [
  {
    accessorKey: 'authorInfo.title',
    header: 'Title',
    cell: ({ row }) => {
      const title = row.original.generalInfo?.title || ''
      return (
        <Tooltip title={title} arrow>
          <Typography
            variant="body2"
            sx={{
              fontWeight: 'medium',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              maxWidth: '250px',
              lineHeight: '1.4',
            }}
          >
            {title}
          </Typography>
        </Tooltip>
      )
    },
  },
  {
    accessorKey: 'observationInfo.objectName',
    header: 'Object Name',
    cell: ({ row }) => {
      const objectName = row.original.observationInfo?.objectName || ''
      return <Typography variant="body2">{objectName}</Typography>
    },
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.getValue('status') as TRaftStatus
      return <StatusBadge status={status} />
    },
  },
  {
    accessorKey: 'observationInfo.topic',
    header: 'Topic',
    cell: ({ row }) => {
      const topic = row.original.observationInfo?.topic || ''
      return (
        <Typography
          variant="body2"
          sx={{
            textTransform: 'capitalize',
            fontStyle: topic ? 'normal' : 'italic',
          }}
        >
          {topic ? topic?.map?.((t) => t.replace(/_/g, ' ')).join(', ') : 'Not specified'}
        </Typography>
      )
    },
  },
  {
    accessorKey: 'createdAt',
    header: 'Created',
    cell: ({ row }) => {
      const createdAt = row.original.createdAt
      try {
        const date = createdAt ? dayjs(createdAt).format('MMM D, YYYY') : ''
        return <Typography variant="body2">{date}</Typography>
      } catch {
        return <Typography variant="body2">{createdAt || ''}</Typography>
      }
    },
  },
  {
    accessorKey: 'createdBy',
    header: 'Author',
    cell: ({ row }) => {
      const createdBy = row.getValue('createdBy') as string
      const author = row.original.authorInfo?.correspondingAuthor
      const authorName = author ? `${author.firstName} ${author.lastName}` : createdBy || ''

      return (
        <Typography variant="body2" sx={{ fontStyle: authorName ? 'normal' : 'italic' }}>
          {authorName || 'Unknown'}
        </Typography>
      )
    },
  },
  {
    id: 'actions',
    header: '',
    cell: ({ row }) => {
      return <ActionMenu rowData={row.original} />
    },
  },
]
