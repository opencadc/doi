// TextPreview.tsx - Independent component for previewing text content
import React from 'react'
import { Paper, Typography, useTheme } from '@mui/material'

interface TextPreviewProps {
  text: string
  maxHeight?: string | number
}

const TextPreview: React.FC<TextPreviewProps> = ({ text, maxHeight = '200px' }) => {
  const theme = useTheme()

  if (!text) return null

  return (
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
        overflow: 'auto',
      }}
    >
      <Typography variant="subtitle2" gutterBottom>
        Preview:
      </Typography>
      {/* Use pre tag to preserve whitespace and formatting */}
      <pre
        style={{
          margin: 0,
          whiteSpace: 'pre-wrap' /* preserve line breaks */,
          wordBreak: 'break-word' /* break long words */,
          fontFamily: 'monospace',
          fontSize: theme.typography.body2.fontSize,
          color: theme.palette.text.primary,
          overflowX: 'auto',
        }}
      >
        {text}
      </pre>
    </Paper>
  )
}

export default TextPreview
