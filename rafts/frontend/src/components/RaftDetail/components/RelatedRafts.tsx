'use client'

import { Paper, Typography, Divider } from '@mui/material'

interface RelatedRaftsProps {
  relatedRafts: string[]
}

export default function RelatedRafts({ relatedRafts }: RelatedRaftsProps) {
  return (
    <Paper elevation={2} sx={{ borderRadius: 2, p: 3, mb: 4 }}>
      <Typography variant="h6" gutterBottom>
        Related RAFTs
      </Typography>
      <Divider sx={{ mb: 2 }} />
      {/* Here you would render a list of related RAFTs */}
      <Typography variant="body2" color="text.secondary">
        This RAFT has {relatedRafts.length} related announcements.
      </Typography>
    </Paper>
  )
}
