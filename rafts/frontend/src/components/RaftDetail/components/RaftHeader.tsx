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
} from 'lucide-react'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

// Extend dayjs with the relativeTime plugin
dayjs.extend(relativeTime)
import StatusBadge from '@/components/RaftTable/StatusBadge'
import { RaftData } from '@/types/doi'
import DOILinks from '@/components/RaftDetail/components/DOILinks'

interface RaftHeaderProps {
  raftData: Partial<RaftData>
  isEditable: boolean
  isDeletable: boolean
  canSubmitForReview?: boolean
  isSubmittingForReview?: boolean
  onDownload?: () => void
  onShare?: () => void
  onEdit?: () => void
  onDelete?: () => void
  onSubmitForReview?: () => void
}

export default function RaftHeader({
  raftData,
  isEditable,
  isDeletable,
  canSubmitForReview = false,
  isSubmittingForReview = false,
  onDownload,
  onShare,
  onEdit,
  onDelete,
  onSubmitForReview,
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
  } = raftData
  const status = generalInfo?.status
  const title = generalInfo?.title

  return (
    <Box
      sx={{
        p: 3,
        bgcolor: 'primary.50',
        borderBottom: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Box
        sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}
      >
        <Box sx={{ maxWidth: '75%' }}>
          <Typography variant="h4" gutterBottom>
            {title || 'Untitled RAFT'}
          </Typography>

          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
            <StatusBadge status={status} />

            {reviewer && (
              <Chip
                icon={<UserCheck size={14} />}
                label={`Reviewer: ${reviewer}`}
                size="small"
                color="primary"
                variant="outlined"
              />
            )}

            {observationInfo?.topic?.map?.((top) => (
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

          <Box sx={{ display: 'flex', gap: 3, mt: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Calendar size={16} />
              <Typography variant="body2">{dayjs(createdAt).format('MMM D, YYYY')}</Typography>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <User size={16} />
              <Typography variant="body2">
                {authorInfo?.correspondingAuthor
                  ? `${authorInfo.correspondingAuthor.firstName} ${authorInfo.correspondingAuthor.lastName}`
                  : createdBy}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Clock size={16} />
              <Typography variant="body2">
                Updated {dayjs(updatedAt).format('MMM D, YYYY')}
              </Typography>
            </Box>
          </Box>
          {doi && <DOILinks doi={doi} />}
        </Box>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Download RAFT">
            <Button
              variant="outlined"
              size="small"
              startIcon={<Download size={18} />}
              onClick={onDownload}
              disabled
            >
              Download
            </Button>
          </Tooltip>

          <Tooltip title="Share RAFT">
            <Button
              variant="outlined"
              size="small"
              startIcon={<Share2 size={18} />}
              onClick={onShare}
              disabled
            >
              Share
            </Button>
          </Tooltip>

          {isEditable && (
            <Tooltip title="Edit RAFT">
              <Button
                variant="outlined"
                size="small"
                startIcon={<Pencil size={18} />}
                onClick={onEdit}
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
              >
                {isSubmittingForReview ? 'Submitting...' : 'Review Ready'}
              </Button>
            </Tooltip>
          )}

          {isDeletable && (
            <Tooltip title="Delete RAFT">
              <Button
                variant="outlined"
                size="small"
                color="error"
                startIcon={<Trash2 size={18} />}
                onClick={onDelete}
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
