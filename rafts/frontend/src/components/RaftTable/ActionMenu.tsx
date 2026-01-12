'use client'

import { useState } from 'react'
import {
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Tooltip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Snackbar,
  Alert,
} from '@mui/material'
import {
  MoreVertical,
  Eye,
  Download,
  Edit,
  Trash2,
  Link2,
  Copy,
  SendHorizontal,
} from 'lucide-react'
import type { RaftData } from '@/types/doi'
import { useRouter } from 'next/navigation'
import { submitForReview } from '@/actions/submitForReview'
import { deleteRaft } from '@/actions/deleteRaft'

interface ActionMenuProps {
  rowData: RaftData
  onStatusChange?: () => void
}

export default function ActionMenu({ rowData, onStatusChange }: ActionMenuProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [snackbar, setSnackbar] = useState<{
    open: boolean
    message: string
    severity: 'success' | 'error'
  }>({ open: false, message: '', severity: 'success' })
  const open = Boolean(anchorEl)
  const router = useRouter()

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const handleView = () => {
    router.push(`/view/rafts/${rowData._id}`)
    handleClose()
  }

  const handleDownload = () => {
    // Implement download functionality - typically you'd create a download URL
    handleClose()
  }

  const handleEdit = () => {
    router.push(`/form/edit/${rowData._id}`)
    handleClose()
  }

  const handleDelete = () => {
    handleClose()
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!rowData.id) {
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
      const result = await deleteRaft(rowData.id)
      if (result.success) {
        setSnackbar({
          open: true,
          message: 'RAFT deleted successfully',
          severity: 'success',
        })
        setDeleteDialogOpen(false)
        // Refresh the table data
        onStatusChange?.()
        router.refresh()
      } else {
        setSnackbar({
          open: true,
          message: result.message || 'Failed to delete RAFT',
          severity: 'error',
        })
        setDeleteDialogOpen(false)
      }
    } catch (error) {
      console.error('[ActionMenu] Error deleting RAFT:', error)
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

  const handleSnackbarClose = () => {
    setSnackbar((prev) => ({ ...prev, open: false }))
  }

  const handleCopyId = () => {
    navigator.clipboard.writeText(rowData._id)
    // You might want to show a toast notification here
    handleClose()
  }

  const handleCopyLink = () => {
    const url = `${window.location.origin}/raft/${rowData._id}`
    navigator.clipboard.writeText(url)
    // You might want to show a toast notification here
    handleClose()
  }

  const handleSubmitForReview = async () => {
    if (!rowData.id) {
      console.error('[ActionMenu] No DOI ID available')
      return
    }

    setIsSubmitting(true)
    try {
      const result = await submitForReview(rowData.id)
      if (result.success) {
        // Refresh the table data
        onStatusChange?.()
        router.refresh()
      } else {
        console.error('[ActionMenu] Failed to submit for review:', result.message)
        // You might want to show an error toast here
      }
    } catch (error) {
      console.error('[ActionMenu] Error submitting for review:', error)
    } finally {
      setIsSubmitting(false)
      handleClose()
    }
  }

  // Determine what actions are available based on status
  // Note: Backend uses 'in progress' for draft, frontend uses 'draft'
  const currentStatus = rowData.generalInfo?.status?.toLowerCase() ?? ''
  const isDraft = ['draft', 'in progress'].includes(currentStatus)
  const isEditable = isDraft || ['rejected', 'review'].includes(currentStatus)
  const isDeletable = isDraft
  const canSubmitForReview = isDraft

  return (
    <div>
      <Tooltip title="Actions">
        <IconButton
          aria-label="more actions"
          aria-controls={open ? 'raft-action-menu' : undefined}
          aria-haspopup="true"
          aria-expanded={open ? 'true' : undefined}
          onClick={handleClick}
          size="small"
        >
          <MoreVertical size={18} />
        </IconButton>
      </Tooltip>
      <Menu
        id="raft-action-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          'aria-labelledby': 'basic-button',
          dense: true,
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem onClick={handleView}>
          <ListItemIcon>
            <Eye size={18} />
          </ListItemIcon>
          <ListItemText>View</ListItemText>
        </MenuItem>

        <MenuItem onClick={handleDownload}>
          <ListItemIcon>
            <Download size={18} />
          </ListItemIcon>
          <ListItemText>Download</ListItemText>
        </MenuItem>

        <Divider />

        <MenuItem onClick={handleCopyId}>
          <ListItemIcon>
            <Copy size={18} />
          </ListItemIcon>
          <ListItemText>Copy ID</ListItemText>
        </MenuItem>

        <MenuItem onClick={handleCopyLink}>
          <ListItemIcon>
            <Link2 size={18} />
          </ListItemIcon>
          <ListItemText>Copy Link</ListItemText>
        </MenuItem>

        <Divider />

        <MenuItem onClick={handleEdit} disabled={!isEditable}>
          <ListItemIcon>
            <Edit size={18} />
          </ListItemIcon>
          <ListItemText>Edit</ListItemText>
        </MenuItem>

        {canSubmitForReview && (
          <MenuItem onClick={handleSubmitForReview} disabled={isSubmitting}>
            <ListItemIcon>
              {isSubmitting ? (
                <CircularProgress size={18} />
              ) : (
                <SendHorizontal size={18} color="#1976d2" />
              )}
            </ListItemIcon>
            <ListItemText sx={{ color: 'primary.main' }}>
              {isSubmitting ? 'Submitting...' : 'Review Ready'}
            </ListItemText>
          </MenuItem>
        )}

        <MenuItem onClick={handleDelete} disabled={!isDeletable}>
          <ListItemIcon>
            <Trash2 size={18} color={isDeletable ? 'red' : 'gray'} />
          </ListItemIcon>
          <ListItemText sx={{ color: isDeletable ? 'error.main' : 'text.disabled' }}>
            Delete
          </ListItemText>
        </MenuItem>
      </Menu>

      {/* Delete confirmation dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={isDeleting ? undefined : () => setDeleteDialogOpen(false)}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <DialogTitle id="delete-dialog-title">Delete RAFT</DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-dialog-description">
            Are you sure you want to delete this RAFT? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={isDeleting}>
            Cancel
          </Button>
          <Button
            onClick={confirmDelete}
            color="error"
            variant="contained"
            disabled={isDeleting}
            startIcon={isDeleting ? <CircularProgress size={16} color="inherit" /> : undefined}
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

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
    </div>
  )
}
