/*
 ************************************************************************
 *******************  CANADIAN ASTRONOMY DATA CENTRE  *******************
 **************  CENTRE CANADIEN DE DONNÉES ASTRONOMIQUES  **************
 *
 *  (c) 2026.                            (c) 2026.
 *  Government of Canada                 Gouvernement du Canada
 *  National Research Council            Conseil national de recherches
 *  Ottawa, Canada, K1A 0R6              Ottawa, Canada, K1A 0R6
 *  All rights reserved                  Tous droits réservés
 *
 *  NRC disclaims any warranties,        Le CNRC dénie toute garantie
 *  expressed, implied, or               énoncée, implicite ou légale,
 *  statutory, of any kind with          de quelque nature que ce
 *  respect to the software,             soit, concernant le logiciel,
 *  including without limitation         y compris sans restriction
 *  any warranty of merchantability      toute garantie de valeur
 *  or fitness for a particular          marchande ou de pertinence
 *  purpose. NRC shall not be            pour un usage particulier.
 *  liable in any event for any          Le CNRC ne pourra en aucun cas
 *  damages, whether direct or           être tenu responsable de tout
 *  indirect, special or general,        dommage, direct ou indirect,
 *  consequential or incidental,         particulier ou général,
 *  arising from the use of the          accessoire ou fortuit, résultant
 *  software.  Neither the name          de l'utilisation du logiciel. Ni
 *  of the National Research             le nom du Conseil National de
 *  Council of Canada nor the            Recherches du Canada ni les noms
 *  names of its contributors may        de ses  participants ne peuvent
 *  be used to endorse or promote        être utilisés pour approuver ou
 *  products derived from this           promouvoir les produits dérivés
 *  software without specific prior      de ce logiciel sans autorisation
 *  written permission.                  préalable et particulière
 *                                       par écrit.
 *
 *  This file is part of the             Ce fichier fait partie du projet
 *  OpenCADC project.                    OpenCADC.
 *
 *  OpenCADC is free software:           OpenCADC est un logiciel libre ;
 *  you can redistribute it and/or       vous pouvez le redistribuer ou le
 *  modify it under the terms of         modifier suivant les termes de
 *  the GNU Affero General Public        la "GNU Affero General Public
 *  License as published by the          License" telle que publiée
 *  Free Software Foundation,            par la Free Software Foundation
 *  either version 3 of the              : soit la version 3 de cette
 *  License, or (at your option)         licence, soit (à votre gré)
 *  any later version.                   toute version ultérieure.
 *
 *  OpenCADC is distributed in the       OpenCADC est distribué
 *  hope that it will be useful,         dans l'espoir qu'il vous
 *  but WITHOUT ANY WARRANTY;            sera utile, mais SANS AUCUNE
 *  without even the implied             GARANTIE : sans même la garantie
 *  warranty of MERCHANTABILITY          implicite de COMMERCIALISABILITÉ
 *  or FITNESS FOR A PARTICULAR          ni d'ADÉQUATION À UN OBJECTIF
 *  PURPOSE.  See the GNU Affero         PARTICULIER. Consultez la Licence
 *  General Public License for           Générale Publique GNU Affero
 *  more details.                        pour plus de détails.
 *
 *  You should have received             Vous devriez avoir reçu une
 *  a copy of the GNU Affero             copie de la Licence Générale
 *  General Public License along         Publique GNU Affero avec
 *  with OpenCADC.  If not, see          OpenCADC ; si ce n'est
 *  <http://www.gnu.org/licenses/>.      pas le cas, consultez :
 *                                       <http://www.gnu.org/licenses/>.
 *
 ************************************************************************
 */

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
