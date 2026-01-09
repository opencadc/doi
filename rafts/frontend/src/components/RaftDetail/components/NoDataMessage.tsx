'use client'

import { Box, Typography } from '@mui/material'
import { ReactNode } from 'react'

interface NoDataMessageProps {
  icon: ReactNode
  title: string
  message: string
}

export default function NoDataMessage({ icon, title, message }: NoDataMessageProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        py: 8,
        px: 4,
      }}
    >
      <Box sx={{ color: 'text.disabled', mb: 2 }}>{icon}</Box>
      <Typography variant="h6" color="text.secondary" gutterBottom>
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary" align="center">
        {message}
      </Typography>
    </Box>
  )
}
