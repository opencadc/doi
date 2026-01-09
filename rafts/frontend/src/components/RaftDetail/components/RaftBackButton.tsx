'use client'

import { Button } from '@mui/material'
import { ArrowLeft } from 'lucide-react'

interface RaftBackButtonProps {
  onBack: () => void
}

export default function RaftBackButton({ onBack }: RaftBackButtonProps) {
  return (
    <Button startIcon={<ArrowLeft size={18} />} onClick={onBack} sx={{ mb: 3 }}>
      Back
    </Button>
  )
}
