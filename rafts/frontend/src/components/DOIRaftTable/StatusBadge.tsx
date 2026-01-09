'use client'

import { Chip, Tooltip } from '@mui/material'

type StatusType =
  | 'minted'
  | 'in progress'
  | 'review ready'
  | 'in review'
  | 'approved'
  | 'rejected'
  | string

interface StatusBadgeProps {
  status: StatusType
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const getStatusInfo = (status: StatusType) => {
    switch (status?.toLowerCase()) {
      // Published/Minted
      case 'minted':
      case 'published':
        return {
          bg: 'success.main',
          color: 'white',
          label: 'Published',
          tooltip: 'This RAFT has been published with a DOI',
        }

      // Approved (awaiting minting)
      case 'approved':
        return {
          bg: 'info.main',
          color: 'white',
          label: 'Approved',
          tooltip: 'This RAFT has been approved and is ready for publishing',
        }

      // Review Ready (submitted, waiting for reviewer to claim)
      case 'review ready':
        return {
          bg: 'warning.light',
          color: 'black',
          label: 'Review Ready',
          tooltip: 'This RAFT has been submitted and is waiting for a reviewer',
        }

      // In Review (reviewer has claimed)
      case 'in review':
        return {
          bg: 'warning.main',
          color: 'black',
          label: 'In Review',
          tooltip: 'This RAFT is being reviewed',
        }

      // Rejected
      case 'rejected':
        return {
          bg: 'error.main',
          color: 'white',
          label: 'Rejected',
          tooltip: 'This RAFT has been rejected',
        }

      // Draft/In Progress
      case 'in progress':
      default:
        return {
          bg: 'grey.400',
          color: 'black',
          label: 'Draft',
          tooltip: 'This RAFT is a draft',
        }
    }
  }

  const { bg, color, label, tooltip } = getStatusInfo(status)

  return (
    <Tooltip title={tooltip} arrow placement="top">
      <Chip
        label={label}
        size="small"
        sx={{
          backgroundColor: bg,
          color: color,
          fontWeight: 'medium',
        }}
      />
    </Tooltip>
  )
}
