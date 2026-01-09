'use client'

import { Chip, Tooltip } from '@mui/material'
import { TRaftStatus } from '@/shared/model'
import { useTranslations } from 'next-intl'

// Backend status values from DOI service
const BACKEND_STATUS = {
  IN_PROGRESS: 'in progress',
  REVIEW_READY: 'review ready',
  IN_REVIEW: 'in review',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  MINTED: 'minted',
} as const

interface StatusBadgeProps {
  status?: TRaftStatus | string
}

const getStatusInfo = (
  status?: TRaftStatus | string,
): { bg: string; color: string; tooltipKey: string; displayKey: string } => {
  const normalizedStatus = status?.toLowerCase()

  switch (normalizedStatus) {
    // Published/Minted
    case BACKEND_STATUS.MINTED:
    case 'published':
      return {
        bg: 'success.main',
        color: 'white',
        tooltipKey: 'tooltip_published',
        displayKey: 'minted',
      }

    // Approved
    case BACKEND_STATUS.APPROVED:
      return {
        bg: 'info.main',
        color: 'white',
        tooltipKey: 'tooltip_approved',
        displayKey: 'approved',
      }

    // Review Ready (author submitted, waiting for reviewer to claim)
    case BACKEND_STATUS.REVIEW_READY:
    case 'review_ready':
      return {
        bg: 'warning.light',
        color: 'black',
        tooltipKey: 'tooltip_review_ready',
        displayKey: 'review ready',
      }

    // In Review (reviewer has claimed and is reviewing)
    case BACKEND_STATUS.IN_REVIEW:
    case 'under_review':
      return {
        bg: 'warning.main',
        color: 'black',
        tooltipKey: 'tooltip_in_review',
        displayKey: 'in review',
      }

    // Rejected
    case BACKEND_STATUS.REJECTED:
      return {
        bg: 'error.main',
        color: 'white',
        tooltipKey: 'tooltip_rejected',
        displayKey: 'rejected',
      }

    // Draft/In Progress
    case BACKEND_STATUS.IN_PROGRESS:
    case 'draft':
    default:
      return {
        bg: 'grey.400',
        color: 'black',
        tooltipKey: 'tooltip_draft',
        displayKey: 'in progress',
      }
  }
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const t = useTranslations('raft_table')

  const { bg, color, tooltipKey, displayKey } = getStatusInfo(status)

  return (
    <Tooltip title={t(tooltipKey)} arrow placement="top">
      <Chip
        label={t(displayKey)}
        size="small"
        sx={{
          backgroundColor: bg,
          color: color,
          fontWeight: 'medium',
          textTransform: 'capitalize',
          minWidth: '80px',
          justifyContent: 'center',
        }}
      />
    </Tooltip>
  )
}
