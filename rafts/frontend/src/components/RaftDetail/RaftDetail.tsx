'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { RaftData } from '@/types/doi'
import { Container, Paper, Box, Snackbar, Alert } from '@mui/material'

// Import modular components
import RaftBreadcrumbs from './components/RaftBreadcrumbs'
import RaftBackButton from './components/RaftBackButton'
import RaftHeader from './components/RaftHeader'
import RaftTabs from './components/RaftTabs'
import RelatedRafts from './components/RelatedRafts'
import DeleteConfirmationDialog from './components/DeleteConfirmationDialog'

// Import tab content components
import OverviewTab from './tabs/OverviewTab'
import TechnicalInfoTab from './tabs/TechnicalInfoTab'
import AdditionalInfoTab from './tabs/AdditionalInfoTab'

// Import server actions
import { submitForReview } from '@/actions/submitForReview'
import { updateDOIStatus } from '@/actions/updateDOIStatus'
import { deleteRaft } from '@/actions/deleteRaft'
import { BACKEND_STATUS } from '@/shared/backendStatus'

interface RaftDetailProps {
  raftData: Partial<RaftData>
}

export default function RaftDetail({ raftData }: RaftDetailProps) {
  const router = useRouter()
  const [tabValue, setTabValue] = useState(0)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [isSubmittingForReview, setIsSubmittingForReview] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [snackbar, setSnackbar] = useState<{
    open: boolean
    message: string
    severity: 'success' | 'error'
  }>({ open: false, message: '', severity: 'success' })

  if (!raftData) {
    return null
  }

  // Check if user can edit/delete based on status
  const currentStatus = raftData?.generalInfo?.status?.toLowerCase() ?? ''
  const isDraft = currentStatus === BACKEND_STATUS.IN_PROGRESS || currentStatus === 'draft'
  const isRejected = currentStatus === BACKEND_STATUS.REJECTED
  const isEditable = isDraft || isRejected
  const isDeletable = isDraft
  const canSubmitForReview = isDraft

  // Handle tab changes
  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue)
  }

  // Handle download
  const handleDownload = () => {
    // Implement download logic here
  }

  // Handle share
  const handleShare = () => {
    const url = window.location.href
    navigator.clipboard.writeText(url)
    // You would normally show a toast notification here
  }

  // Handle edit
  const handleEdit = async () => {
    // If the RAFT is rejected, change status to "in progress" (draft) before editing
    if (isRejected && raftData.id) {
      try {
        const result = await updateDOIStatus(raftData.id, BACKEND_STATUS.IN_PROGRESS)
        if (!result.success) {
          console.error('[RaftDetail] Failed to update status:', result.message)
          setSnackbar({
            open: true,
            message: result.message || 'Failed to revert to draft',
            severity: 'error',
          })
          return
        }
        setSnackbar({
          open: true,
          message: 'RAFT reverted to draft for editing',
          severity: 'success',
        })
      } catch (error) {
        console.error('[RaftDetail] Error updating status:', error)
        setSnackbar({
          open: true,
          message: 'An error occurred while updating status',
          severity: 'error',
        })
        return
      }
    }

    router.push(`/form/edit/${raftData.id}`)
  }

  // Handle delete action
  const handleDelete = () => {
    setDeleteDialogOpen(true)
  }

  // Confirm delete action
  const confirmDelete = async () => {
    if (!raftData.id) {
      setSnackbar({
        open: true,
        message: 'No RAFT ID available',
        severity: 'error',
      })
      setDeleteDialogOpen(false)
      return
    }

    setIsDeleting(true)
    try {
      const result = await deleteRaft(raftData.id)
      if (result.success) {
        setSnackbar({
          open: true,
          message: 'RAFT deleted successfully',
          severity: 'success',
        })
        setDeleteDialogOpen(false)
        // Redirect after a short delay to show the success message
        setTimeout(() => {
          router.push('/view/rafts')
        }, 1500)
      } else {
        setSnackbar({
          open: true,
          message: result.message || 'Failed to delete RAFT',
          severity: 'error',
        })
        setDeleteDialogOpen(false)
      }
    } catch (error) {
      console.error('[RaftDetail] Error deleting RAFT:', error)
      setSnackbar({
        open: true,
        message: 'An error occurred while deleting RAFT',
        severity: 'error',
      })
      setDeleteDialogOpen(false)
    } finally {
      setIsDeleting(false)
    }
  }

  // Handle submit for review
  const handleSubmitForReview = async () => {
    if (!raftData.id) {
      setSnackbar({
        open: true,
        message: 'No DOI ID available',
        severity: 'error',
      })
      return
    }

    setIsSubmittingForReview(true)
    try {
      const result = await submitForReview(raftData.id)
      if (result.success) {
        setSnackbar({
          open: true,
          message: 'RAFT submitted for review successfully',
          severity: 'success',
        })
        // Refresh the page to reflect the new status
        router.refresh()
      } else {
        setSnackbar({
          open: true,
          message: result.message || 'Failed to submit for review',
          severity: 'error',
        })
      }
    } catch (error) {
      console.error('[RaftDetail] Error submitting for review:', error)
      setSnackbar({
        open: true,
        message: 'An error occurred while submitting for review',
        severity: 'error',
      })
    } finally {
      setIsSubmittingForReview(false)
    }
  }

  // Handle snackbar close
  const handleSnackbarClose = () => {
    setSnackbar((prev) => ({ ...prev, open: false }))
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Breadcrumbs navigation */}
      <RaftBreadcrumbs title={raftData?.generalInfo?.title} />

      {/* Back button */}
      <RaftBackButton onBack={() => router.back()} />

      {/* Main content */}
      <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden', mb: 4 }}>
        {/* Header section with title, metadata, and action buttons */}
        <RaftHeader
          raftData={raftData}
          isEditable={isEditable}
          isDeletable={isDeletable}
          canSubmitForReview={canSubmitForReview}
          isSubmittingForReview={isSubmittingForReview}
          onDownload={handleDownload}
          onShare={handleShare}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onSubmitForReview={handleSubmitForReview}
        />

        {/* Tabs navigation */}
        <RaftTabs value={tabValue} onChange={handleTabChange} />

        {/* Tab content panels */}
        <Box>
          {tabValue === 0 && (
            <OverviewTab
              objectName={raftData.observationInfo?.objectName}
              relatedPublishedRafts={raftData.observationInfo?.relatedPublishedRafts}
              abstract={raftData.observationInfo?.abstract}
              authorInfo={raftData.authorInfo}
              acknowledgements={raftData.observationInfo?.acknowledgements}
              figure={raftData.observationInfo?.figure}
              doiId={raftData.id}
              dataDirectory={raftData.dataDirectory}
            />
          )}

          {tabValue === 1 && (
            <TechnicalInfoTab technical={raftData.technical} doiId={raftData.id} />
          )}

          {tabValue === 2 && <AdditionalInfoTab miscInfo={raftData.miscInfo} />}
        </Box>
      </Paper>

      {/* Related RAFTs section - if any */}
      {raftData.relatedRafts && raftData.relatedRafts.length > 0 && (
        <RelatedRafts relatedRafts={raftData.relatedRafts} />
      )}

      {/* Delete confirmation dialog */}
      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={confirmDelete}
        isDeleting={isDeleting}
      />

      {/* Snackbar for feedback */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  )
}
