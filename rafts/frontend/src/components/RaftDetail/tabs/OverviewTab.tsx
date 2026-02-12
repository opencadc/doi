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

import { Box, Typography, Paper, Avatar, Grid, Button, Tooltip } from '@mui/material'
import { TAuthor } from '@/shared/model'
import React from 'react'
import AttachmentImage from '@/components/common/AttachmentImage'
import { Database } from 'lucide-react'
import { STORAGE_PARTIAL_URL } from '@/utilities/constants'

interface OverviewTabProps {
  abstract?: string
  objectName?: string
  relatedPublishedRafts?: string
  authorInfo?: TAuthor | null
  acknowledgements?: string
  figure?: string
  /** DOI identifier for resolving FileReference attachments */
  doiId?: string
  /** Data directory path for storage links (e.g., /rafts-test/RAFTS-xxx/data) */
  dataDirectory?: string
}

export default function OverviewTab({
  abstract,
  objectName,
  relatedPublishedRafts,
  authorInfo,
  acknowledgements,
  figure,
  doiId,
  dataDirectory,
}: OverviewTabProps) {
  // Construct the storage URL for viewing attachments using dataDirectory
  const storageUrl = dataDirectory ? `${STORAGE_PARTIAL_URL}${dataDirectory}` : null

  return (
    <Grid container sx={{ p: 2 }}>
      <Grid size={{ lg: 12 }}>
        {/* Data Page Link */}
        {storageUrl && (
          <Box sx={{ mb: 2 }}>
            <Tooltip title={`View uploaded data and attachments: ${storageUrl}`}>
              <Button
                variant="outlined"
                size="small"
                endIcon={<Database size={16} />}
                onClick={() => window.open(storageUrl, '_blank')}
              >
                View Data & Attachments
              </Button>
            </Tooltip>
          </Box>
        )}

        <Grid container sx={{ p: 2 }}>
          {/* Abstract */}

          {objectName && (
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="h6" gutterBottom>
                Object Name
              </Typography>
              <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                {objectName}
              </Typography>
            </Grid>
          )}
          {abstract && (
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="h6" gutterBottom>
                Abstract
              </Typography>
              <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                {abstract}
              </Typography>
            </Grid>
          )}
          {figure && (
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="h6" gutterBottom>
                Figure
              </Typography>
              <AttachmentImage
                value={figure}
                doiId={doiId}
                alt="Uploaded preview"
                width={200}
                height={200}
                previewTitle="Figure"
              />
            </Grid>
          )}
        </Grid>
        {/* Authors */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Authors
          </Typography>
          <Grid container spacing={2}>
            {/* Corresponding Author */}
            {authorInfo?.correspondingAuthor && (
              <Grid size={{ xs: 12, md: 6 }}>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                    Corresponding Author
                  </Typography>
                  <Paper variant="outlined" sx={{ p: 2, mt: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ bgcolor: 'primary.main' }}>
                        {authorInfo.correspondingAuthor.firstName?.[0] || ''}
                        {authorInfo.correspondingAuthor.lastName?.[0] || ''}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle1">
                          {authorInfo.correspondingAuthor.firstName}{' '}
                          {authorInfo.correspondingAuthor.lastName}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          ORCID: {authorInfo.correspondingAuthor.authorORCID}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {authorInfo.correspondingAuthor.affiliation}
                        </Typography>
                        <Typography variant="body2" color="primary">
                          {authorInfo.correspondingAuthor.email}
                        </Typography>
                      </Box>
                    </Box>
                  </Paper>
                </Box>{' '}
              </Grid>
            )}
            {/* Contributing Authors */}
            <Grid size={{ xs: 12, md: 6 }}>
              {authorInfo?.contributingAuthors && authorInfo.contributingAuthors.length > 0 && (
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                    Contributing Authors
                  </Typography>
                  <Grid container spacing={2}>
                    {authorInfo.contributingAuthors.map((author, index) => (
                      <Grid size={{ lg: 12 }} key={index}>
                        <Paper variant="outlined" sx={{ p: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Avatar sx={{ bgcolor: 'secondary.main' }}>
                              {author.firstName?.[0] || ''}
                              {author.lastName?.[0] || ''}
                            </Avatar>
                            <Box>
                              <Typography variant="subtitle1">
                                {author.firstName} {author.lastName}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                ORCID: {author.authorORCID}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {author.affiliation}
                              </Typography>
                              <Typography variant="body2" color="primary">
                                {author.email}
                              </Typography>
                            </Box>
                          </Box>
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              )}
            </Grid>{' '}
          </Grid>

          {/* Collaborations */}
          {authorInfo?.collaborations && authorInfo.collaborations.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                Collaborations
              </Typography>
              <Grid container spacing={1}>
                {authorInfo.collaborations.map((collab, index) => (
                  <Grid key={index}>
                    <Paper variant="outlined" sx={{ p: 1.5, px: 2 }}>
                      <Typography variant="body1">{collab}</Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}
        </Box>

        {/* Acknowledgements */}
        {acknowledgements && (
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Box sx={{ mb: 4 }}>
                <Typography variant="h6" gutterBottom>
                  Acknowledgements
                </Typography>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                    {acknowledgements}
                  </Typography>
                </Paper>
              </Box>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Box sx={{ mb: 4 }}>
                <Typography variant="h6" gutterBottom>
                  Related RAFTs
                </Typography>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                    {relatedPublishedRafts}
                  </Typography>
                </Paper>
              </Box>
            </Grid>
          </Grid>
        )}
      </Grid>
    </Grid>
  )
}
