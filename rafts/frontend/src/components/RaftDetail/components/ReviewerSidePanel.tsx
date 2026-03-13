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

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { RaftData } from '@/types/doi'
import { RaftReview } from '@/types/reviews'
import { updateDOIStatus } from '@/actions/updateDOIStatus'
import { BACKEND_STATUS, BackendStatusType, getStatusDisplayName } from '@/shared/backendStatus'
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
  Stepper,
  Step,
  StepLabel,
} from '@mui/material'
import { CheckCircle, XCircle, Undo2, UserCheck, UserX } from 'lucide-react'
import StatusBadge from '@/components/common/StatusBadge'
import { formatDate, formatUserName } from '@/utilities/formatter'
import { useTranslations } from 'next-intl'
import { publishRAFTDOI, getMintingStatus } from '@/actions/publishRaftDoi'

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
  const [showAllHistory, setShowAllHistory] = useState(false)
  const [mintingStep, setMintingStep] = useState(-1) // -1 = not minting
  const [mintingLabel, setMintingLabel] = useState('')
  const mintingRef = useRef(false)
  const t = useTranslations('raft_table')

  const MINT_STEPS = ['Locking Data', 'Registering', 'Published']

  // Poll minting status while publish is in progress
  const pollMintingStatus = useCallback(async () => {
    if (!raftData?._id && !raftData?.id) return
    const id = raftData._id || raftData.id || ''

    mintingRef.current = true
    while (mintingRef.current) {
      try {
        const result = await getMintingStatus(id)
        setMintingStep(result.step)
        setMintingLabel(result.label)
        if (result.step >= 3 || !mintingRef.current) break
      } catch {
        break
      }
      await new Promise((r) => setTimeout(r, 2000))
    }
  }, [raftData])

  // Clean up polling on unmount
  useEffect(() => {
    return () => {
      mintingRef.current = false
    }
  }, [])

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
        onNotify('success', 'RAFTS status changed to In Review.')
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
        onNotify('success', 'RAFTS status changed to Review Ready.')
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
      setMintingStep(0)
      setMintingLabel('Starting...')

      // Start polling status in parallel
      pollMintingStatus()

      const result = await publishRAFTDOI(raftId, {
        dataDirectory: raftData.dataDirectory,
        previousStatus: raftData.generalInfo?.status,
      })

      // Stop polling
      mintingRef.current = false

      if (result.success) {
        setMintingStep(3)
        setMintingLabel('Published')
        onNotify('success', result.message || `RAFTS DOI published successfully.`)

        setTimeout(() => {
          router.push(`/public-view/rafts/${raftId}`)
        }, 2000)
      } else {
        onNotify('error', result.message || 'Failed to publish RAFTS DOI.')
        setMintingStep(-1)
      }
    } catch (error) {
      mintingRef.current = false
      setMintingStep(-1)
      console.error('[handlePublishingDOI] Error:', error)
      onNotify('error', 'An unexpected error occurred.')
    } finally {
      setActionLoading(false)
    }
  }

  // Handle status change using DOI backend
  const handleStatusChange = async (newStatus: BackendStatusType) => {
    try {
      setActionLoading(true)
      setStatusAction(newStatus)

      const result = await updateDOIStatus(raftId, newStatus)

      if (result.success) {
        onNotify(
          'success',
          result.message || `RAFTS status changed to ${getStatusDisplayName(newStatus)}.`,
        )

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

  // Render status history from RAFT.json metadata or review object
  const VISIBLE_HISTORY_COUNT = 3

  const renderStatusHistory = () => {
    // Prefer RAFT.json statusHistory, fall back to review statusHistory
    const raftHistory = raftData.statusHistory || []
    const reviewHistory = review?.statusHistory || []

    if (raftHistory.length === 0 && reviewHistory.length === 0) {
      return (
        <Typography variant="body2" color="text.secondary">
          No status changes recorded
        </Typography>
      )
    }

    // Use RAFT.json history if available, otherwise use review history
    const useReview = raftHistory.length === 0

    if (useReview) {
      const reversed = [...reviewHistory].reverse()
      const visible = showAllHistory ? reversed : reversed.slice(0, VISIBLE_HISTORY_COUNT)
      const hiddenCount = reversed.length - VISIBLE_HISTORY_COUNT

      return (
        <>
          <List dense sx={{ py: 0 }}>
            {visible.map((change, index) => (
              <ListItem key={change._id || `review-${index}`} sx={{ py: 0.5, px: 0 }}>
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
          {hiddenCount > 0 && (
            <Button
              size="small"
              onClick={() => setShowAllHistory(!showAllHistory)}
              sx={{ textTransform: 'none', mt: 0.5 }}
            >
              {showAllHistory
                ? 'Show less'
                : `Show ${hiddenCount} older entr${hiddenCount === 1 ? 'y' : 'ies'}`}
            </Button>
          )}
        </>
      )
    }

    // RAFT.json history (RaftStatusChange with string changedBy)
    const reversed = [...raftHistory].reverse()
    const visible = showAllHistory ? reversed : reversed.slice(0, VISIBLE_HISTORY_COUNT)
    const hiddenCount = reversed.length - VISIBLE_HISTORY_COUNT

    return (
      <>
        <List dense sx={{ py: 0 }}>
          {visible.map((change, index) => (
            <ListItem key={`raft-${index}`} sx={{ py: 0.5, px: 0 }}>
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
                      {formatDate(change.changedAt)} by {change.changedBy}
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
        {hiddenCount > 0 && (
          <Button
            size="small"
            onClick={() => setShowAllHistory(!showAllHistory)}
            sx={{ textTransform: 'none', mt: 0.5 }}
          >
            {showAllHistory
              ? 'Show less'
              : `Show ${hiddenCount} older entr${hiddenCount === 1 ? 'y' : 'ies'}`}
          </Button>
        )}
      </>
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
            <Tooltip title="Claim this RAFTS for review and become the assigned reviewer">
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
              Claiming this RAFTS will assign you as the reviewer and change the status to &quot;In
              Review&quot;.
            </Typography>
          </Box>
        )

      // "in review" status: reviewer can approve, reject, or send back for revision
      case BACKEND_STATUS.IN_REVIEW:
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Tooltip title="Approve RAFTS">
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
              <Tooltip title="Reject RAFTS">
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
            {mintingStep >= 0 ? (
              <Box sx={{ mb: 1 }}>
                <Stepper activeStep={mintingStep} alternativeLabel>
                  {MINT_STEPS.map((label) => (
                    <Step key={label}>
                      <StepLabel>{label}</StepLabel>
                    </Step>
                  ))}
                </Stepper>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mt: 1, gap: 1 }}>
                  <CircularProgress size={16} />
                  <Typography variant="body2" color="text.secondary">
                    {mintingLabel}
                  </Typography>
                </Box>
              </Box>
            ) : (
              <>
                <Tooltip title="Mint and Publish DOI">
                  <Button
                    variant="contained"
                    color="success"
                    onClick={handlePublishingDOI}
                    startIcon={<CheckCircle />}
                    disabled={actionLoading}
                  >
                    Publish DOI
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
              </>
            )}
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

      // Intermediate minting statuses: may be stuck from a previous attempt
      case BACKEND_STATUS.LOCKING_DATA:
      case BACKEND_STATUS.LOCKED_DATA:
      case BACKEND_STATUS.REGISTERING: {
        const resumeStep =
          currentStatus === BACKEND_STATUS.LOCKING_DATA ? 1 :
          currentStatus === BACKEND_STATUS.LOCKED_DATA ? 2 :
          2
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <Stepper activeStep={mintingStep >= 0 ? mintingStep : resumeStep} alternativeLabel>
              {MINT_STEPS.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>
            {mintingStep >= 0 ? (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                <CircularProgress size={16} />
                <Typography variant="body2" color="text.secondary">
                  {mintingLabel}
                </Typography>
              </Box>
            ) : (
              <>
                <Typography variant="body2" color="text.secondary">
                  Publishing was started but did not complete.
                </Typography>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handlePublishingDOI}
                  startIcon={<CheckCircle />}
                  disabled={actionLoading}
                >
                  Resume Publishing
                </Button>
              </>
            )}
          </Box>
        )
      }

      // Error during minting: allow retry
      case BACKEND_STATUS.ERROR_LOCKING_DATA:
      case BACKEND_STATUS.ERROR_REGISTERING: {
        const errorStep = currentStatus === BACKEND_STATUS.ERROR_LOCKING_DATA ? 1 : 2
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <Stepper activeStep={errorStep} alternativeLabel>
              {MINT_STEPS.map((label, i) => (
                <Step key={label}>
                  <StepLabel error={i === errorStep}>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>
            <Typography variant="body2" color="error">
              An error occurred during publishing. You can retry.
            </Typography>
            <Button
              variant="contained"
              color="warning"
              onClick={handlePublishingDOI}
              startIcon={<CheckCircle />}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                'Retry Publish'
              )}
            </Button>
          </Box>
        )
      }

      // "minted" status: no actions available (published)
      case BACKEND_STATUS.MINTED:
        return (
          <Typography variant="body2" color="text.secondary">
            This RAFTS has been published and cannot be modified.
          </Typography>
        )

      // "in progress" status: draft, not yet submitted for review
      case BACKEND_STATUS.IN_PROGRESS:
        return (
          <Typography variant="body2" color="text.secondary">
            This RAFTS is a draft and has not been submitted for review yet.
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
            Created by
          </Typography>
          <Typography variant="body2">{raftData.createdBy || 'N/A'}</Typography>
        </Box>

        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Submitted
          </Typography>
          <Typography variant="body2">
            {raftData.submittedAt
              ? formatDate(raftData.submittedAt)
              : raftData.createdAt
                ? formatDate(raftData.createdAt)
                : 'N/A'}
          </Typography>
        </Box>

        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Topic
          </Typography>
          {raftData.observationInfo?.topic?.map?.((top) => (
            <Chip
              key={top}
              label={top.replace(/_/g, ' ')}
              size="small"
              color="secondary"
              variant="outlined"
              sx={{ textTransform: 'capitalize', mb: 0.5 }}
            />
          ))}
        </Box>

        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Current Version
          </Typography>
          <Typography variant="body2">
            v{raftData.version || review?.currentVersion || 1}
          </Typography>
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
