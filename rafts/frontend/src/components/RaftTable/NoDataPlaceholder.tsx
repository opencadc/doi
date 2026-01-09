'use client'

import { Box, Typography, Button } from '@mui/material'
import { FileQuestion } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface NoDataPlaceholderProps {
  message: string
  subMessage?: string
  showCreateButton?: boolean
}

export default function NoDataPlaceholder({
  message,
  subMessage,
  showCreateButton = true,
}: NoDataPlaceholderProps) {
  const router = useRouter()

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        py: 6,
        px: 2,
        textAlign: 'center',
      }}
    >
      <FileQuestion size={64} strokeWidth={1.5} className="text-gray-400 mb-4" />

      <Typography variant="h6" sx={{ mb: 1, color: 'text.primary' }}>
        {message}
      </Typography>

      {subMessage && (
        <Typography variant="body2" sx={{ mb: 3, color: 'text.secondary', maxWidth: '400px' }}>
          {subMessage}
        </Typography>
      )}

      {showCreateButton && (
        <Button variant="contained" color="primary" onClick={() => router.push('/form/create')}>
          Create a RAFT
        </Button>
      )}
    </Box>
  )
}
