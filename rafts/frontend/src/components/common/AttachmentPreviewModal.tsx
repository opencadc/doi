'use client'

import React from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Box,
  Typography,
  useTheme,
  CircularProgress,
} from '@mui/material'
import { X } from 'lucide-react'

interface AttachmentPreviewModalProps {
  open: boolean
  onClose: () => void
  title?: string
  type: 'image' | 'text'
  /** Image URL for image type */
  imageUrl?: string
  /** Text content for text type */
  textContent?: string
  /** Loading state */
  isLoading?: boolean
  /** Error message */
  error?: string
}

/**
 * Modal for previewing attachments (images or text files) in a larger view.
 * Takes 80% of the viewport.
 */
export default function AttachmentPreviewModal({
  open,
  onClose,
  title = 'Preview',
  type,
  imageUrl,
  textContent,
  isLoading = false,
  error,
}: AttachmentPreviewModalProps) {
  const theme = useTheme()

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={false}
      PaperProps={{
        sx: {
          width: '80vw',
          height: '80vh',
          maxWidth: '80vw',
          maxHeight: '80vh',
          m: 2,
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: `1px solid ${theme.palette.divider}`,
          py: 1.5,
        }}
      >
        <Typography variant="h6" component="span">
          {title}
        </Typography>
        <IconButton onClick={onClose} size="small" aria-label="Close preview">
          <X size={20} />
        </IconButton>
      </DialogTitle>

      <DialogContent
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 3,
          overflow: 'auto',
          bgcolor: type === 'image' ? theme.palette.grey[900] : theme.palette.background.paper,
        }}
      >
        {isLoading ? (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
            }}
          >
            <CircularProgress />
            <Typography variant="body2" color="text.secondary">
              Loading...
            </Typography>
          </Box>
        ) : error ? (
          <Typography variant="body1" color="error">
            {error}
          </Typography>
        ) : type === 'image' && imageUrl ? (
          <Box
            sx={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt={title}
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain',
                borderRadius: '4px',
              }}
            />
          </Box>
        ) : type === 'text' && textContent ? (
          <Box
            sx={{
              width: '100%',
              height: '100%',
              overflow: 'auto',
              bgcolor:
                theme.palette.mode === 'dark'
                  ? theme.palette.background.default
                  : theme.palette.grey[50],
              borderRadius: 1,
              p: 2,
            }}
          >
            <pre
              style={{
                margin: 0,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                fontFamily: 'monospace',
                fontSize: '14px',
                lineHeight: 1.6,
                color: theme.palette.text.primary,
              }}
            >
              {textContent}
            </pre>
          </Box>
        ) : (
          <Typography variant="body1" color="text.secondary">
            No content available
          </Typography>
        )}
      </DialogContent>
    </Dialog>
  )
}
