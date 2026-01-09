'use client'

import React from 'react'
import { Tooltip, IconButton } from '@mui/material'
import { Eye } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { RaftData } from '@/types/doi'

interface ActionsCellProps {
  raft: RaftData
  currentStatus?: string
  onStatusUpdate?: () => void
}

/**
 * Cell component for rendering action buttons in the RAFT review table
 */
const ActionsCell: React.FC<ActionsCellProps> = ({ raft }) => {
  const router = useRouter()
  const raftId = raft._id

  // View details handler
  const handleView = () => {
    router.push(`/review/rafts/${raftId}`)
  }

  return (
    <Tooltip title="View RAFT">
      <IconButton onClick={handleView} size="small">
        <Eye size={18} />
      </IconButton>
    </Tooltip>
  )
}

export default ActionsCell
