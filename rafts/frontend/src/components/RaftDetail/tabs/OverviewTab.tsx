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
                                ORCID: {authorInfo.correspondingAuthor.authorORCID}
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
