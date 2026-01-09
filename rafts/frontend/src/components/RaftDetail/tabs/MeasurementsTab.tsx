'use client'

import { Box, Typography, Paper, Grid } from '@mui/material'
import { AlertTriangle } from 'lucide-react'
import { TMeasurementInfo } from '@/shared/model'
import NoDataMessage from '../components/NoDataMessage'

interface MeasurementsTabProps {
  measurementInfo?: TMeasurementInfo | null
}

export default function MeasurementsTab({ measurementInfo }: MeasurementsTabProps) {
  // Check if there's any measurement data
  const hasMeasurementData =
    measurementInfo &&
    ((measurementInfo.photometry && Object.values(measurementInfo.photometry).some(Boolean)) ||
      (measurementInfo.spectroscopy && Object.values(measurementInfo.spectroscopy).some(Boolean)) ||
      (measurementInfo.astrometry && Object.values(measurementInfo.astrometry).some(Boolean)))

  if (!hasMeasurementData) {
    return (
      <NoDataMessage
        icon={<AlertTriangle size={40} />}
        title="No Measurement Data"
        message="This RAFT does not contain any measurement information."
      />
    )
  }

  return (
    <Box sx={{ p: 2 }}>
      <Grid container spacing={3}>
        {/* Photometry */}
        {measurementInfo?.photometry && Object.values(measurementInfo.photometry).some(Boolean) && (
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="h6" gutterBottom>
              Photometry
            </Typography>
            <Paper variant="outlined" sx={{ p: 2 }}>
              {measurementInfo.photometry.wavelength && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Wavelength
                  </Typography>
                  <Typography variant="body1">{measurementInfo.photometry.wavelength}</Typography>
                </Box>
              )}

              {measurementInfo.photometry.brightness && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Brightness
                  </Typography>
                  <Typography variant="body1">{measurementInfo.photometry.brightness}</Typography>
                </Box>
              )}

              {measurementInfo.photometry.errors && (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Errors
                  </Typography>
                  <Typography variant="body1">{measurementInfo.photometry.errors}</Typography>
                </Box>
              )}
            </Paper>
          </Grid>
        )}

        {/* Spectroscopy */}
        {measurementInfo?.spectroscopy &&
          Object.values(measurementInfo.spectroscopy).some(Boolean) && (
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="h6" gutterBottom>
                Spectroscopy
              </Typography>
              <Paper variant="outlined" sx={{ p: 2 }}>
                {measurementInfo.spectroscopy.wavelength && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Wavelength
                    </Typography>
                    <Typography variant="body1">
                      {measurementInfo.spectroscopy.wavelength}
                    </Typography>
                  </Box>
                )}

                {measurementInfo.spectroscopy.flux && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Flux
                    </Typography>
                    <Typography variant="body1">{measurementInfo.spectroscopy.flux}</Typography>
                  </Box>
                )}

                {measurementInfo.spectroscopy.errors && (
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Errors
                    </Typography>
                    <Typography variant="body1">{measurementInfo.spectroscopy.errors}</Typography>
                  </Box>
                )}
              </Paper>
            </Grid>
          )}

        {/* Astrometry */}
        {measurementInfo?.astrometry && Object.values(measurementInfo.astrometry).some(Boolean) && (
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="h6" gutterBottom>
              Astrometry
            </Typography>
            <Paper variant="outlined" sx={{ p: 2 }}>
              {measurementInfo.astrometry.position && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Position
                  </Typography>
                  <Typography variant="body1">{measurementInfo.astrometry.position}</Typography>
                </Box>
              )}

              {measurementInfo.astrometry.timeObserved && (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Time Observed
                  </Typography>
                  <Typography variant="body1">{measurementInfo.astrometry.timeObserved}</Typography>
                </Box>
              )}
            </Paper>
          </Grid>
        )}
      </Grid>
    </Box>
  )
}
