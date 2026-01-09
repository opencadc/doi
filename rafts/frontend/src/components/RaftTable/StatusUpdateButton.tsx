'use client'

import React from 'react'
import { Tooltip, IconButton } from '@mui/material'
import { updateRaftStatus } from '@/actions/updateRaftStatus'

interface StatusUpdateButtonProps {
  raftId: string
  newStatus: string
  icon: React.ReactNode
  color: string
  tooltip: string
  onStatusUpdate?: () => void
}

/**
 * Button component for updating a RAFT's status
 */
const StatusUpdateButton: React.FC<StatusUpdateButtonProps> = ({
  raftId,
  newStatus,
  icon,
  color,
  tooltip,
  onStatusUpdate,
}) => {
  const [isLoading, setIsLoading] = React.useState(false)

  const handleStatusUpdate = async () => {
    try {
      setIsLoading(true)
      await updateRaftStatus(raftId, newStatus)
      if (onStatusUpdate) onStatusUpdate()
    } catch (error) {
      console.error('Failed to update status:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Tooltip title={tooltip}>
      <IconButton onClick={handleStatusUpdate} disabled={isLoading} size="small" sx={{ color }}>
        {icon}
      </IconButton>
    </Tooltip>
  )
}

export default StatusUpdateButton
