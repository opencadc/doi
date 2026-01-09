'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Box, CircularProgress, IconButton, Paper, Typography, useTheme } from '@mui/material'
import { Eye } from 'lucide-react'
import { parseStoredAttachment, isFileReference, AttachmentValue } from '@/types/attachments'
import AttachmentPreviewModal from './AttachmentPreviewModal'

interface AttachmentTextProps {
  /** The attachment value - can be plain text string or FileReference JSON */
  value: AttachmentValue | string | undefined | null
  /** DOI identifier for resolving FileReference attachments */
  doiId?: string
  /** Maximum height of the preview area */
  maxHeight?: string | number
  /** Show "Preview:" label */
  showLabel?: boolean
  /** Title for the preview modal */
  previewTitle?: string
  /** Whether to show the preview button */
  showPreview?: boolean
}

/**
 * Reusable component for displaying text file attachments.
 *
 * Handles:
 * - Plain text strings (displayed directly)
 * - FileReference objects (fetched from API and displayed)
 *
 * Shows a loading spinner while text is being fetched from API.
 */
export default function AttachmentText({
  value,
  doiId,
  maxHeight = '200px',
  showLabel = true,
  previewTitle = 'Text Preview',
  showPreview = true,
}: AttachmentTextProps) {
  const theme = useTheme()
  const [isLoading, setIsLoading] = useState(false)
  const [textContent, setTextContent] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const lastResolvedRef = useRef<string | null>(null)

  // Resolve the text content from the value
  useEffect(() => {
    if (!value) {
      setTextContent(null)
      setIsLoading(false)
      setError(null)
      lastResolvedRef.current = null
      return
    }

    // Create a stable key for comparison
    const valueKey =
      typeof value === 'string'
        ? `str:${value.substring(0, 50)}`
        : isFileReference(value)
          ? `ref:${value.filename}`
          : null

    // Skip if we've already resolved this exact value
    if (valueKey && lastResolvedRef.current === valueKey) {
      return
    }

    // Try to parse as FileReference
    const parsed = typeof value === 'string' ? parseStoredAttachment(value) : value

    if (isFileReference(parsed) && doiId) {
      // It's a FileReference - fetch from API
      setIsLoading(true)
      setError(null)

      const apiUrl = `/api/attachments/${doiId}/${encodeURIComponent(parsed.filename)}`

      fetch(apiUrl)
        .then(async (response) => {
          if (!response.ok) {
            throw new Error(`Failed to fetch: ${response.status}`)
          }
          const text = await response.text()
          setTextContent(text)
          lastResolvedRef.current = valueKey
        })
        .catch((err) => {
          console.error('[AttachmentText] Failed to fetch text:', err)
          setError('Failed to load text content')
        })
        .finally(() => {
          setIsLoading(false)
        })
    } else if (typeof value === 'string') {
      // It's plain text - display directly
      setTextContent(value)
      setIsLoading(false)
      lastResolvedRef.current = valueKey
    }
  }, [value, doiId])

  // No value - don't render anything
  if (!value) {
    return null
  }

  return (
    <>
      <Paper
        elevation={0}
        sx={{
          p: 2,
          mt: 1,
          bgcolor:
            theme.palette.mode === 'dark' ? theme.palette.background.paper : theme.palette.grey[50],
          border: '1px solid',
          borderColor: theme.palette.divider,
          borderRadius: theme.shape.borderRadius,
          maxHeight,
          minHeight: '60px',
          overflow: 'auto',
          position: 'relative',
        }}
      >
        {/* Preview button */}
        {showPreview && !isLoading && textContent && (
          <IconButton
            size="small"
            onClick={() => setPreviewOpen(true)}
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              bgcolor: 'background.paper',
              border: `1px solid ${theme.palette.divider}`,
              boxShadow: 1,
              '&:hover': {
                bgcolor: 'primary.main',
                color: 'white',
              },
            }}
            aria-label="Preview text"
          >
            <Eye size={14} />
          </IconButton>
        )}

        {showLabel && (
          <Typography variant="subtitle2" gutterBottom>
            Preview:
          </Typography>
        )}

        {isLoading ? (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '40px',
            }}
          >
            <CircularProgress size={24} />
          </Box>
        ) : error ? (
          <Typography variant="body2" color="error">
            {error}
          </Typography>
        ) : textContent ? (
          <pre
            style={{
              margin: 0,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              fontFamily: 'monospace',
              fontSize: theme.typography.body2.fontSize,
              color: theme.palette.text.primary,
              overflowX: 'auto',
            }}
          >
            {textContent}
          </pre>
        ) : null}
      </Paper>

      {/* Preview Modal */}
      <AttachmentPreviewModal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title={previewTitle}
        type="text"
        textContent={textContent || undefined}
        isLoading={isLoading}
        error={error || undefined}
      />
    </>
  )
}
