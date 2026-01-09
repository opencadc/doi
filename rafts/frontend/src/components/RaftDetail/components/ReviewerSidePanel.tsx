'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { RaftData } from '@/types/doi'
import { RaftReview } from '@/types/reviews'
import { updateDOIStatus } from '@/actions/updateDOIStatus'
import { BACKEND_STATUS, BackendStatusType } from '@/shared/backendStatus'
import { claimForReview, releaseReview } from '@/actions/assignReviewer'
import {
  Card,
  CardContent,
  Box,
  Typography,
  Button,
  Divider,
  List,
  ListItem,
  ListItemText,
  Tooltip,
  CircularProgress,
  Chip,
} from '@mui/material'
import { CheckCircle, XCircle, Undo2, UserCheck, UserX } from 'lucide-react'
import StatusBadge from '@/components/RaftTable/StatusBadge'
import { formatDate, formatUserName } from '@/utilities/formatter'
import { useTranslations } from 'next-intl'
import { publishRAFTDOI } from '@/actions/publishRaftDoi'

interface ReviewerSidePanelProps {
  raftData?: Partial<RaftData>
  review?: RaftReview
  hasReview?: boolean
  onNotify: (type: 'success' | 'error', text: string) => void
}

export default function ReviewerSidePanel({ raftData, review, onNotify }: ReviewerSidePanelProps) {
  const router = useRouter()
  const [statusAction, setStatusAction] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const t = useTranslations('raft_table')

  if (!raftData) {
    return null
  }

  const raftId = raftData._id || raftData.id || ''
  // Get the assigned reviewer from the DOI data (if available)
  const assignedReviewer = raftData.reviewer || null

  // Handle claiming a RAFT for review
  // This sets both reviewer AND status in a single API call
  const handleClaimForReview = async () => {
    try {
      setActionLoading(true)
      setStatusAction('claim')

      // claimForReview sets both reviewer and status to "in review" in one call
      const result = await claimForReview(raftId)

      if (result.success) {
        onNotify('success', 'RAFT claimed for review successfully.')
        setTimeout(() => {
          router.refresh()
        }, 1000)
      } else {
        onNotify('error', result.message || 'Failed to claim for review.')
      }
    } catch (error) {
      console.error('Error claiming for review:', error)
      onNotify('error', 'An unexpected error occurred.')
    } finally {
      setActionLoading(false)
    }
  }

  // Handle releasing a review (unassign reviewer and change status back to review ready)
  // This sets both in a single API call
  const handleReleaseReview = async () => {
    try {
      setActionLoading(true)
      setStatusAction('release')

      // releaseReview unassigns reviewer and sets status to "review ready" in one call
      const result = await releaseReview(raftId)

      if (result.success) {
        onNotify('success', 'Review released successfully.')
        setTimeout(() => {
          router.refresh()
        }, 1000)
      } else {
        onNotify('error', result.message || 'Failed to release review.')
      }
    } catch (error) {
      console.error('Error releasing review:', error)
      onNotify('error', 'An unexpected error occurred.')
    } finally {
      setActionLoading(false)
    }
  }

  const handlePublishingDOI = async () => {
    try {
      setActionLoading(true)

      const result = await publishRAFTDOI(raftId)

      if (result.success) {
        onNotify('success', result.message || `RAFT DOI published successfully.`)

        // Refresh the page after a short delay to get updated data
        setTimeout(() => {
          router.refresh()
        }, 2000)
      } else {
        onNotify('error', result.error || 'Failed to publish RAFT DOI.')
      }
    } catch (error) {
      console.error('Error publishing DOI: ', error)
      onNotify('error', 'An unexpected error occurred.')
    }
  }

  // Handle status change using DOI backend
  const handleStatusChange = async (newStatus: BackendStatusType) => {
    try {
      setActionLoading(true)
      setStatusAction(newStatus)

      const result = await updateDOIStatus(raftId, newStatus)

      if (result.success) {
        onNotify('success', result.message || `Status updated to "${newStatus}" successfully.`)

        // Refresh the page after a short delay to get updated data
        setTimeout(() => {
          router.refresh()
        }, 2000)
      } else {
        onNotify('error', result.message || 'Failed to update status.')
      }
    } catch (error) {
      console.error('Error updating status:', error)
      onNotify('error', 'An unexpected error occurred.')
    } finally {
      setActionLoading(false)
    }
  }

  // Render status history
  const renderStatusHistory = () => {
    if (!review?.statusHistory || review?.statusHistory.length === 0) {
      return (
        <Typography variant="body2" color="text.secondary">
          No status changes recorded
        </Typography>
      )
    }

    return (
      <List dense>
        {review?.statusHistory?.map((change) => (
          <ListItem key={change._id} sx={{ py: 1 }}>
            <ListItemText
              primary={
                <Typography variant="body2">
                  <strong>
                    {t(change.fromStatus)} → {t(change.toStatus)}
                  </strong>
                </Typography>
              }
              secondary={
                <>
                  <Typography variant="caption" display="block">
                    {formatDate(change.changedAt)} by {formatUserName(change.changedBy)}
                  </Typography>
                  {change.reason && (
                    <Typography variant="caption" display="block">
                      Reason: {change.reason}
                    </Typography>
                  )}
                </>
              }
            />
          </ListItem>
        ))}
      </List>
    )
  }

  // Render assigned reviewers
  const renderAssignedReviewers = () => {
    // Use raftData.reviewer from DOI backend
    if (assignedReviewer) {
      return (
        <Chip
          icon={<UserCheck size={16} />}
          label={assignedReviewer}
          color="primary"
          variant="outlined"
          sx={{ justifyContent: 'flex-start' }}
        />
      )
    }

    return (
      <Typography variant="body2" color="text.secondary">
        No reviewers assigned
      </Typography>
    )
  }

  // Determine available actions based on current status (using backend status values)
  const getAvailableActions = () => {
    const currentStatus = raftData.generalInfo?.status?.toLowerCase()

    switch (currentStatus) {
      // "review ready" status: publisher can claim for review
      case BACKEND_STATUS.REVIEW_READY:
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <Tooltip title="Claim this RAFT for review and become the assigned reviewer">
              <Button
                variant="contained"
                color="primary"
                onClick={handleClaimForReview}
                startIcon={<UserCheck />}
                disabled={actionLoading}
                fullWidth
              >
                {actionLoading && statusAction === 'claim' ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  'Claim for Review'
                )}
              </Button>
            </Tooltip>
            <Typography variant="body2" color="text.secondary">
              Claiming this RAFT will assign you as the reviewer and change the status to &quot;In
              Review&quot;.
            </Typography>
          </Box>
        )

      // "in review" status: reviewer can approve, reject, or send back for revision
      case BACKEND_STATUS.IN_REVIEW:
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Tooltip title="Approve RAFT">
                <Button
                  variant="contained"
                  color="success"
                  onClick={() => handleStatusChange(BACKEND_STATUS.APPROVED)}
                  startIcon={<CheckCircle />}
                  disabled={actionLoading}
                  fullWidth
                >
                  {actionLoading && statusAction === BACKEND_STATUS.APPROVED ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : (
                    'Approve'
                  )}
                </Button>
              </Tooltip>
              <Tooltip title="Reject RAFT">
                <Button
                  variant="contained"
                  color="error"
                  onClick={() => handleStatusChange(BACKEND_STATUS.REJECTED)}
                  startIcon={<XCircle />}
                  disabled={actionLoading}
                  fullWidth
                >
                  {actionLoading && statusAction === BACKEND_STATUS.REJECTED ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : (
                    'Reject'
                  )}
                </Button>
              </Tooltip>
            </Box>
            <Tooltip title="Send back to author for revision">
              <Button
                variant="outlined"
                color="warning"
                onClick={() => handleStatusChange(BACKEND_STATUS.IN_PROGRESS)}
                startIcon={<Undo2 />}
                disabled={actionLoading}
              >
                {actionLoading && statusAction === BACKEND_STATUS.IN_PROGRESS ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  'Request Revision'
                )}
              </Button>
            </Tooltip>
            <Tooltip title="Release this review and make it available for other reviewers">
              <Button
                variant="outlined"
                color="secondary"
                onClick={handleReleaseReview}
                startIcon={<UserX />}
                disabled={actionLoading}
                size="small"
              >
                {actionLoading && statusAction === 'release' ? (
                  <CircularProgress size={20} color="inherit" />
                ) : (
                  'Release Review'
                )}
              </Button>
            </Tooltip>
          </Box>
        )

      // "approved" status: can publish DOI or send back for revision
      case BACKEND_STATUS.APPROVED:
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <Tooltip title="Mint and Publish DOI">
              <Button
                variant="contained"
                color="success"
                onClick={handlePublishingDOI}
                startIcon={<CheckCircle />}
                disabled={actionLoading}
              >
                {actionLoading && statusAction === BACKEND_STATUS.MINTED ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  'Publish DOI'
                )}
              </Button>
            </Tooltip>
            <Tooltip title="Send back for review">
              <Button
                variant="outlined"
                color="warning"
                onClick={() => handleStatusChange(BACKEND_STATUS.IN_REVIEW)}
                startIcon={<Undo2 />}
                disabled={actionLoading}
              >
                {actionLoading && statusAction === BACKEND_STATUS.IN_REVIEW ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  'Reopen Review'
                )}
              </Button>
            </Tooltip>
          </Box>
        )

      // "rejected" status: author can revise and resubmit (moves back to "in progress")
      case BACKEND_STATUS.REJECTED:
        return (
          <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
            <Tooltip title="Allow author to revise and resubmit">
              <Button
                variant="outlined"
                color="primary"
                onClick={() => handleStatusChange(BACKEND_STATUS.IN_PROGRESS)}
                startIcon={<Undo2 />}
                disabled={actionLoading}
              >
                {actionLoading && statusAction === BACKEND_STATUS.IN_PROGRESS ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  'Allow Revision'
                )}
              </Button>
            </Tooltip>
          </Box>
        )

      // "minted" status: no actions available (published)
      case BACKEND_STATUS.MINTED:
        return (
          <Typography variant="body2" color="text.secondary">
            This RAFT has been published and cannot be modified.
          </Typography>
        )

      // "in progress" status: draft, not yet submitted for review
      case BACKEND_STATUS.IN_PROGRESS:
        return (
          <Typography variant="body2" color="text.secondary">
            This RAFT is a draft and has not been submitted for review yet.
          </Typography>
        )

      default:
        // Show debug info for unexpected statuses
        return (
          <Typography variant="body2" color="text.secondary">
            No actions available for status: {currentStatus || 'unknown'}
          </Typography>
        )
    }
  }

  return (
    <Card sx={{ position: 'sticky', top: 20, borderRadius: 2 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Review Information
        </Typography>

        {/* Assigned Reviewers */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Assigned Reviewers
          </Typography>
          {renderAssignedReviewers()}
        </Box>

        <Divider sx={{ my: 2 }} />

        <Typography variant="subtitle2" gutterBottom>
          Submission Details
        </Typography>

        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Submitted
          </Typography>
          <Typography variant="body2">
            {raftData.createdAt ? formatDate(raftData.createdAt) : 'N/A'}
          </Typography>
        </Box>

        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Topic
          </Typography>
          {raftData.observationInfo?.topic?.map?.((top) => (
            <Typography key={top} variant="body2" sx={{ textTransform: 'capitalize' }}>
              {top.replace('_', ' ') || 'N/A'}
            </Typography>
          ))}
        </Box>

        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Current Version
          </Typography>
          <Typography variant="body2">v{review?.currentVersion || 1}</Typography>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" color="text.secondary">
            Current Status
          </Typography>
          <StatusBadge status={raftData.generalInfo?.status} />
        </Box>

        {/* Status History Section */}
        <Divider sx={{ my: 2 }} />
        <Typography variant="subtitle2" gutterBottom>
          Status History
        </Typography>
        {renderStatusHistory()}

        <Divider sx={{ my: 2 }} />

        <Typography variant="subtitle2" gutterBottom>
          Actions
        </Typography>
        {getAvailableActions()}
      </CardContent>
    </Card>
  )
}
