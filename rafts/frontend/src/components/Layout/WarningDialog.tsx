'use client'

import { FC } from 'react'
import { Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material'

interface WarningDialogOptions {
  title?: string
  message?: string
  cancelCaption?: string
  okCaption?: string
}

interface WarningDialogProps {
  isOpen: boolean
  onCancel: () => void
  onOk: () => void
  options?: WarningDialogOptions
}

const WarningDialog: FC<WarningDialogProps> = ({ isOpen, onCancel, onOk, options = {} }) => {
  const {
    title = 'Are you sure?',
    message = '',
    cancelCaption = 'Cancel',
    okCaption = 'OK',
  } = options

  return (
    <Dialog open={isOpen} onClose={onCancel} maxWidth="xs" fullWidth>
      {title && (
        <DialogTitle>
          <span className="text-red-600 text-lg font-semibold">{title}</span>
        </DialogTitle>
      )}
      {message && (
        <DialogContent>
          <p className="text-gray-700">{message}</p>
        </DialogContent>
      )}
      <DialogActions className="px-4 pb-4">
        <Button onClick={onCancel} color="primary" variant="contained">
          {cancelCaption}
        </Button>
        <Button onClick={onOk} color="error" variant="outlined">
          {okCaption}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default WarningDialog
