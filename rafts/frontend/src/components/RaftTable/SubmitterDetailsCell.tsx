'use client'

import React from 'react'
import { Typography } from '@mui/material'
import { TPerson } from '@/shared/model'

interface SubmitterDetailsCellProps {
  author: TPerson | undefined
}

/**
 * Cell component for displaying submitter details in the RAFT table
 */
const SubmitterDetailsCell: React.FC<SubmitterDetailsCellProps> = ({ author }) => {
  if (!author) return null

  return (
    <Typography variant="body2">
      {author.firstName} {author.lastName}
      <Typography variant="caption" display="block" color="text.secondary">
        {author.affiliation}
      </Typography>
    </Typography>
  )
}

export default SubmitterDetailsCell
