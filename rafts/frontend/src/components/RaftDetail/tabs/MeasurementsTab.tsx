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
