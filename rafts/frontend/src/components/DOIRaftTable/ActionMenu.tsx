'use client'

import React, { useState } from 'react'
import { Box, IconButton, Tooltip, CircularProgress } from '@mui/material'
import { Eye, Edit, SendHorizontal } from 'lucide-react'
import type { DOIData } from '@/types/doi'
import { useRouter } from '@/i18n/routing'
import { submitForReview } from '@/actions/submitForReview'
import { updateDOIStatus } from '@/actions/updateDOIStatus'
import { BACKEND_STATUS } from '@/shared/backendStatus'

interface ActionMenuProps {
  rowData: DOIData
  onStatusChange?: (message: string, severity: 'success' | 'error') => void
}

export default function ActionMenu({ rowData, onStatusChange }: ActionMenuProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  const handleView = () => {
    const raftId = rowData.identifier?.split?.('/')?.[1] as string
    router.push(`/view/doi/${raftId}`)
  }

  const handleEdit = async () => {
    const raftId = rowData.identifier?.split?.('/')?.[1] as string

    // If the RAFT is rejected, change status to "in progress" (draft) before editing
    if (rowData.status === BACKEND_STATUS.REJECTED) {
      setIsSubmitting(true)
      try {
        const result = await updateDOIStatus(raftId, BACKEND_STATUS.IN_PROGRESS)
        if (!result.success) {
          console.error('[ActionMenu] Failed to update status:', result.message)
          onStatusChange?.(result.message || 'Failed to revert to draft', 'error')
          setIsSubmitting(false)
          return
        }
        onStatusChange?.('RAFT reverted to draft for editing', 'success')
      } catch (error) {
        console.error('[ActionMenu] Error updating status:', error)
        onStatusChange?.('An error occurred', 'error')
        setIsSubmitting(false)
        return
      }
      setIsSubmitting(false)
    }

    router.push(`/form/edit/${raftId}`)
  }

  const handleSubmitForReview = async () => {
    const raftId = rowData.identifier?.split?.('/')?.[1] as string
    if (!raftId) {
      console.error('[ActionMenu] No DOI ID available')
      onStatusChange?.('No DOI ID available', 'error')
      return
    }

    setIsSubmitting(true)
    try {
      const result = await submitForReview(raftId)
      if (result.success) {
        onStatusChange?.('RAFT submitted for review successfully', 'success')
      } else {
        console.error('[ActionMenu] Failed to submit for review:', result.message)
        onStatusChange?.(result.message || 'Failed to submit for review', 'error')
      }
    } catch (error) {
      console.error('[ActionMenu] Error submitting for review:', error)
      onStatusChange?.('An error occurred while submitting for review', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Check if status allows actions (backend uses 'in progress' for draft)
  const isDraft = rowData.status === BACKEND_STATUS.IN_PROGRESS
  const isRejected = rowData.status === BACKEND_STATUS.REJECTED
  const isEditable = isDraft || isRejected // Authors can edit drafts and rejected RAFTs
  const canSubmitForReview = isDraft

  return (
    <Box sx={{ display: 'flex', gap: 0.5 }}>
      <Tooltip title="View RAFT">
        <IconButton onClick={handleView} size="small">
          <Eye size={18} />
        </IconButton>
      </Tooltip>

      <Tooltip title={isEditable ? 'Edit RAFT' : 'Cannot edit (not a draft)'}>
        <span>
          <IconButton onClick={handleEdit} size="small" disabled={!isEditable || isSubmitting}>
            <Edit size={18} />
          </IconButton>
        </span>
      </Tooltip>

      {canSubmitForReview && (
        <Tooltip title="Submit for Review">
          <IconButton
            onClick={handleSubmitForReview}
            size="small"
            disabled={isSubmitting}
            color="primary"
          >
            {isSubmitting ? <CircularProgress size={18} /> : <SendHorizontal size={18} />}
          </IconButton>
        </Tooltip>
      )}
    </Box>
  )
}
