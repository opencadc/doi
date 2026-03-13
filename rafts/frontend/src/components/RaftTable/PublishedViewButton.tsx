'use client'

import { IconButton, Tooltip } from '@mui/material'
import { Eye } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface PublishedViewButtonProps {
  raftId: string
}

export default function PublishedViewButton({ raftId }: PublishedViewButtonProps) {
  const router = useRouter()

  return (
    <Tooltip title="View">
      <IconButton
        aria-label="view"
        size="small"
        onClick={() => router.push(`/public-view/rafts/${raftId}`)}
      >
        <Eye size={18} />
      </IconButton>
    </Tooltip>
  )
}
