'use client'

import React from 'react'
import { Paper, Box, Typography, ButtonGroup, Button, Chip } from '@mui/material'
import {
  OPTION_REVIEW,
  OPTION_UNDER_REVIEW,
  OPTION_APPROVED,
  OPTION_REJECTED,
} from '@/shared/constants'
import { useTranslations } from 'next-intl'

interface StatusFilterProps {
  currentStatus: string
  counts: Record<string, number>
  onStatusChange: (status: string) => void
}

const StatusFilter: React.FC<StatusFilterProps> = ({ currentStatus, counts, onStatusChange }) => {
  const t = useTranslations('review_page')

  // Map status to display name
  const getStatusDisplayName = (status: string): string => {
    return t(`status_${status}`)
  }

  // Map status to button color
  const getButtonColor = (status: string) => {
    if (status === currentStatus) {
      return 'primary'
    }
    return 'inherit'
  }

  const statusOptions = [OPTION_REVIEW, OPTION_UNDER_REVIEW, OPTION_APPROVED, OPTION_REJECTED]

  return (
    <Paper elevation={2} className="p-4 mb-6">
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle1" gutterBottom>
          {t('filter_by_status')}
        </Typography>
        <ButtonGroup variant="outlined" sx={{ mb: 2 }}>
          {statusOptions.map((status) => (
            <Button
              key={status}
              onClick={() => onStatusChange(status)}
              color={getButtonColor(status)}
              variant={currentStatus === status ? 'contained' : 'outlined'}
              sx={{ textTransform: 'none' }}
            >
              {getStatusDisplayName(status)}
              {counts[status] > 0 && (
                <Chip
                  label={counts[status]}
                  size="small"
                  color={currentStatus === status ? 'secondary' : 'default'}
                  sx={{ ml: 1, height: 20 }}
                />
              )}
            </Button>
          ))}
        </ButtonGroup>
      </Box>

      <Typography variant="h6">
        {getStatusDisplayName(currentStatus)}
        <Chip
          label={counts[currentStatus] || 0}
          color="primary"
          size="small"
          sx={{ ml: 1, verticalAlign: 'middle' }}
        />
      </Typography>
    </Paper>
  )
}

export default StatusFilter
