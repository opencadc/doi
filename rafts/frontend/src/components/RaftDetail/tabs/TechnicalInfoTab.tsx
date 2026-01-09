'use client'

import { Box, Typography, Paper, Grid } from '@mui/material'
import { AlertTriangle } from 'lucide-react'
import { TTechInfo } from '@/shared/model'
import NoDataMessage from '../components/NoDataMessage'
import {
  PROP_ASTROMETRY,
  PROP_EPHEMERIS,
  PROP_ORBITAL_ELEMENTS,
  PROP_SPECTROSCOPY,
} from '@/shared/constants'
import AttachmentText from '@/components/common/AttachmentText'
import React from 'react'

interface TechnicalInfoTabProps {
  technical?: TTechInfo | null
  /** DOI identifier for resolving FileReference attachments */
  doiId?: string
}

const TechnicalInfoTab = ({ technical, doiId }: TechnicalInfoTabProps) => {
  // Check if there's any technical data
  const hasTechnicalData = technical && Object.values(technical).some((value) => !!value)

  if (!hasTechnicalData) {
    return (
      <NoDataMessage
        icon={<AlertTriangle size={40} />}
        title="No Technical Information"
        message="This RAFT does not contain any technical details."
      />
    )
  }

  return (
    <Box sx={{ p: 2 }}>
      <Grid container spacing={3}>
        {/* Observation Details */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Typography variant="h6" gutterBottom>
            Observation Details
          </Typography>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              {technical?.mpcId && (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    MPC ID
                  </Typography>
                  <Typography variant="body1">{technical.mpcId}</Typography>
                </Box>
              )}

              {technical?.alertId && (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Alert ID
                  </Typography>
                  <Typography variant="body1">{technical.alertId}</Typography>
                </Box>
              )}

              {technical?.mjd && (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Modified Julian Date
                  </Typography>
                  <Typography variant="body1">{technical.mjd}</Typography>
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Telescope & Instrument */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Typography variant="h6" gutterBottom>
            Observation Equipment
          </Typography>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              {technical?.telescope && (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Telescope
                  </Typography>
                  <Typography variant="body1">{technical.telescope}</Typography>
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Photometry */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Typography variant="h6" gutterBottom>
            Photometry
          </Typography>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              {technical?.photometry?.wavelength && (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Wavelength
                  </Typography>
                  <Typography variant="body1">{technical?.photometry?.wavelength}</Typography>
                </Box>
              )}
              {technical?.photometry?.brightness && (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Brightness
                  </Typography>
                  <Typography variant="body1">{technical?.photometry?.brightness}</Typography>
                </Box>
              )}
              {technical?.photometry?.errors && (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Errors
                  </Typography>
                  <Typography variant="body1">{technical?.photometry?.errors}</Typography>
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Ephemeris */}
        {technical?.[PROP_EPHEMERIS] && (
          <Grid size={{ xs: 12 }}>
            <Typography variant="h6" gutterBottom>
              Ephemeris
            </Typography>
            <AttachmentText
              value={technical[PROP_EPHEMERIS]}
              doiId={doiId}
              showLabel={false}
              previewTitle="Ephemeris"
            />
          </Grid>
        )}

        {/* Orbital Elements */}
        {technical?.[PROP_ORBITAL_ELEMENTS] && (
          <Grid size={{ xs: 12 }}>
            <Typography variant="h6" gutterBottom>
              Orbital Elements
            </Typography>
            <AttachmentText
              value={technical[PROP_ORBITAL_ELEMENTS]}
              doiId={doiId}
              showLabel={false}
              previewTitle="Orbital Elements"
            />
          </Grid>
        )}
        {/* Spectroscopy */}
        {technical?.[PROP_SPECTROSCOPY] && (
          <Grid size={{ xs: 12 }}>
            <Typography variant="h6" gutterBottom>
              Spectroscopy
            </Typography>
            <AttachmentText
              value={technical[PROP_SPECTROSCOPY]}
              doiId={doiId}
              showLabel={false}
              previewTitle="Spectroscopy"
            />
          </Grid>
        )}
        {/* Astrometry */}
        {technical?.[PROP_ASTROMETRY] && (
          <Grid size={{ xs: 12 }}>
            <Typography variant="h6" gutterBottom>
              Astrometry
            </Typography>
            <AttachmentText
              value={technical[PROP_ASTROMETRY]}
              doiId={doiId}
              showLabel={false}
              previewTitle="Astrometry"
            />
          </Grid>
        )}
      </Grid>
    </Box>
  )
}

export default TechnicalInfoTab
