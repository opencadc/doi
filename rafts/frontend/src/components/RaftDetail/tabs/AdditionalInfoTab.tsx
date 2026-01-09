'use client'

import { Box, Typography, Paper, Grid } from '@mui/material'
import { AlertTriangle } from 'lucide-react'
import { TMiscInfo } from '@/shared/model'
import NoDataMessage from '../components/NoDataMessage'

interface AdditionalInfoTabProps {
  miscInfo?: TMiscInfo | null
}

export default function AdditionalInfoTab({ miscInfo }: AdditionalInfoTabProps) {
  const hasMiscData = miscInfo?.misc && miscInfo.misc.length > 0

  if (!hasMiscData) {
    return (
      <NoDataMessage
        icon={<AlertTriangle size={40} />}
        title="No Additional Information"
        message="This RAFT does not contain any additional information."
      />
    )
  }

  return (
    <Box sx={{ p: 2 }}>
      <Grid container spacing={2}>
        {miscInfo?.misc?.map((item, index) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={index}>
            <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                {item.miscKey}
              </Typography>
              <Typography variant="body1">{item.miscValue}</Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  )
}
