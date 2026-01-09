'use client'

import {
  PROP_AUTHOR_INFO,
  PROP_OBSERVATION_INFO,
  PROP_TECHNICAL_INFO,
  PROP_MISC_INFO,
  PROP_TITLE,
  PROP_CORRESPONDING_AUTHOR,
  PROP_CONTRIBUTING_AUTHORS,
  PROP_COLLABORATIONS,
  PROP_AUTHOR_FIRST_NAME,
  PROP_AUTHOR_LAST_NAME,
  PROP_AUTHOR_AFFILIATION,
  PROP_AUTHOR_EMAIL,
  PROP_TOPIC,
  PROP_OBJECT_NAME,
  PROP_ABSTRACT,
  PROP_FIGURE,
  PROP_ACKNOWLEDGEMENTS,
  PROP_EPHEMERIS,
  PROP_ORBITAL_ELEMENTS,
  PROP_MPC_ID,
  PROP_ALERT_ID,
  PROP_MJD,
  PROP_TELESCOPE,
  PROP_SPECTROSCOPY,
  PROP_ASTROMETRY,
  PROP_MISC,
  PROP_MISC_KEY,
  PROP_MISC_VALUE,
  PROP_AUTHOR_ORCID,
  PROP_PREVIOUS_RAFTS,
  PROP_PHOTOMETRY,
  PROP_WAVELENGTH,
  PROP_BRIGHTNESS,
  PROP_ERRORS,
  PROP_POST_OPT_OUT,
} from '@/shared/constants'
import { useTranslations } from 'next-intl'
import {
  Paper,
  Typography,
  Divider,
  Box,
  Chip,
  useTheme,
  Checkbox,
  FormControlLabel,
} from '@mui/material'
import { TPerson, TRaftSubmission } from '@/shared/model'
import React from 'react'
import AttachmentImage from '@/components/common/AttachmentImage'
import AttachmentText from '@/components/common/AttachmentText'

interface ReviewFormProps {
  raftData: TRaftSubmission
  onOptOutChange?: (checked: boolean) => void
  /** DOI identifier for resolving FileReference attachments */
  doiId?: string
}

const ReviewForm = ({ raftData, onOptOutChange, doiId }: ReviewFormProps) => {
  const t = useTranslations('submission_form')
  const theme = useTheme()

  // Helper function to render author information
  const renderAuthor = (author: TPerson, isCorresponding = false) => {
    if (!author) return null

    return (
      <Box sx={{ mb: 2 }}>
        <Typography variant="body1" color="text.primary" fontWeight="bold">
          {author[PROP_AUTHOR_FIRST_NAME]} {author[PROP_AUTHOR_LAST_NAME]}
        </Typography>
        {isCorresponding && (
          <Chip label={t('corresponding')} size="small" color="primary" sx={{ ml: 1 }} />
        )}
        <Typography variant="body2" color="text.secondary">
          ORCID: {author[PROP_AUTHOR_ORCID]}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {author[PROP_AUTHOR_AFFILIATION]}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {author[PROP_AUTHOR_EMAIL]}
        </Typography>
      </Box>
    )
  }

  // Extract data sections
  const authorInfo = raftData[PROP_AUTHOR_INFO]
  const observationInfo = raftData[PROP_OBSERVATION_INFO]
  const technicalInfo = raftData[PROP_TECHNICAL_INFO]
  const miscInfo = raftData[PROP_MISC_INFO]

  // Helper function to render a text section if it exists
  const renderSection = (title: string, content: string | undefined) => {
    if (!content || content?.length === 0) return null

    return (
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" fontWeight="bold" color="text.primary">
          {title}
        </Typography>
        <Typography variant="body2" whiteSpace="pre-wrap" color="text.primary">
          {content}
        </Typography>
      </Box>
    )
  }

  return (
    <Paper elevation={3} sx={{ p: 3 }}>
      <Typography variant="h5" align="center" gutterBottom color="text.primary">
        {t('review_title')}
      </Typography>

      {/* RAFT Title */}
      {raftData.generalInfo && (
        <Typography variant="h6" align="center" gutterBottom color="text.primary">
          {raftData.generalInfo[PROP_TITLE]}
        </Typography>
      )}

      <Divider sx={{ my: 2 }} />

      {/* Author Information */}
      {authorInfo && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" color="text.primary">
            {t('author_info')}
          </Typography>

          {/* Corresponding Author */}
          {renderAuthor(authorInfo[PROP_CORRESPONDING_AUTHOR], true)}

          {/* Contributing Authors */}
          {authorInfo[PROP_CONTRIBUTING_AUTHORS] &&
            authorInfo[PROP_CONTRIBUTING_AUTHORS]?.length > 0 && (
              <>
                <Typography variant="subtitle1" color="text.primary">
                  {t('con_authors')}
                </Typography>
                {authorInfo[PROP_CONTRIBUTING_AUTHORS].map((author, index) => (
                  <Box key={index} sx={{ pl: 2 }}>
                    {renderAuthor(author)}
                  </Box>
                ))}
              </>
            )}

          {/* Collaborations */}
          {authorInfo[PROP_COLLABORATIONS] && authorInfo[PROP_COLLABORATIONS]?.length > 0 && (
            <>
              <Typography variant="subtitle1" sx={{ mt: 2 }} color="text.primary">
                {t('collaborations')}
              </Typography>
              {authorInfo[PROP_COLLABORATIONS].map((collab, index) => (
                <Box key={index} sx={{ pl: 2 }}>
                  <Typography variant="body1" color="text.primary" fontWeight="bold">
                    {collab}
                  </Typography>
                </Box>
              ))}
            </>
          )}
        </Box>
      )}

      <Divider sx={{ my: 2 }} />

      {/* Observation Information */}
      {observationInfo && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" color="text.primary">
            {t('observation_info')}
          </Typography>

          <Box sx={{ mb: 2 }}>
            <Typography variant="body1" color="text.primary" fontWeight="bold">
              {t('topic')}:{' '}
            </Typography>

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {(observationInfo[PROP_TOPIC] as string[]).map((value) => (
                <Chip key={value} label={t(value.toLowerCase())} size="small" />
              ))}
            </Box>
          </Box>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body1" color="text.primary">
              <Typography component="span" fontWeight="bold">
                {t('object_name')}:
              </Typography>{' '}
              {observationInfo[PROP_OBJECT_NAME]}
            </Typography>
          </Box>

          {renderSection(t('abstract'), observationInfo[PROP_ABSTRACT])}
          {observationInfo[PROP_FIGURE] && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" fontWeight="bold" color="text.primary">
                {t('figure')}
              </Typography>
              <AttachmentImage
                value={observationInfo[PROP_FIGURE]}
                doiId={doiId}
                alt="figure"
                width={100}
                height={100}
                previewTitle={t('figure')}
              />
            </Box>
          )}
          {renderSection(t('acknowledgements'), observationInfo[PROP_ACKNOWLEDGEMENTS])}
          {renderSection(t('previouslyPublishedRafts'), observationInfo[PROP_PREVIOUS_RAFTS])}
        </Box>
      )}

      <Divider sx={{ my: 2 }} />

      {/* Technical Information */}
      {technicalInfo && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" color="text.primary">
            {t('technical_info')}
          </Typography>

          <Box sx={{ pl: 2 }}>
            {technicalInfo[PROP_PHOTOMETRY] && (
              <Box
                sx={{
                  margin: '10px 0',
                  padding: '10px',
                  mt: 1,
                  bgcolor:
                    theme.palette.mode === 'dark'
                      ? theme.palette.background.paper
                      : theme.palette.grey[50],
                  border: '1px solid',
                  borderColor: theme.palette.divider,
                  borderRadius: theme.shape.borderRadius,
                  overflow: 'auto',
                }}
              >
                <Typography
                  variant="subtitle1"
                  component={'h3'}
                  sx={{ mb: 1 }}
                  fontWeight="bold"
                  color="text.primary"
                >
                  {t('photometry')}
                </Typography>
                <Typography variant="body2" color="text.primary">
                  <Typography component="span" fontWeight="bold">
                    {t('wavelength')}:
                  </Typography>{' '}
                  {technicalInfo[PROP_PHOTOMETRY]?.[PROP_WAVELENGTH]}
                </Typography>
                <Typography variant="body2" color="text.primary">
                  <Typography component="span" fontWeight="bold">
                    {t('brightness')}:
                  </Typography>{' '}
                  {technicalInfo[PROP_PHOTOMETRY]?.[PROP_BRIGHTNESS]}
                </Typography>
                <Typography variant="body2" color="text.primary">
                  <Typography component="span" fontWeight="bold">
                    {t('errors')}:
                  </Typography>{' '}
                  {technicalInfo[PROP_PHOTOMETRY]?.[PROP_ERRORS]}
                </Typography>
              </Box>
            )}
            {technicalInfo[PROP_EPHEMERIS] && (
              <Box sx={{ mb: 1 }}>
                <Typography variant="body1" color="text.primary" fontWeight="bold">
                  {t('ephemeris')}:
                </Typography>
                <AttachmentText
                  value={technicalInfo[PROP_EPHEMERIS]}
                  doiId={doiId}
                  previewTitle={t('ephemeris')}
                />
              </Box>
            )}
            {technicalInfo[PROP_ORBITAL_ELEMENTS] && (
              <Box sx={{ mb: 1 }}>
                <Typography variant="body1" color="text.primary" fontWeight="bold">
                  {t('orbital_elements')}:
                </Typography>
                <AttachmentText
                  value={technicalInfo[PROP_ORBITAL_ELEMENTS]}
                  doiId={doiId}
                  previewTitle={t('orbital_elements')}
                />
              </Box>
            )}
            {technicalInfo[PROP_MPC_ID] && (
              <Typography variant="body1" sx={{ mb: 1 }} color="text.primary">
                <Typography component="span" fontWeight="bold">
                  {t('mpc_id')}:
                </Typography>{' '}
                {technicalInfo[PROP_MPC_ID]}
              </Typography>
            )}

            {technicalInfo[PROP_ALERT_ID] && (
              <Typography variant="body1" sx={{ mb: 1 }} color="text.primary">
                <Typography component="span" fontWeight="bold">
                  {t('alert_id')}:
                </Typography>{' '}
                {technicalInfo[PROP_ALERT_ID]}
              </Typography>
            )}

            {technicalInfo[PROP_MJD] && (
              <Typography variant="body1" sx={{ mb: 1 }} color="text.primary">
                <Typography component="span" fontWeight="bold">
                  {t('mjd')}:
                </Typography>{' '}
                {technicalInfo[PROP_MJD]}
              </Typography>
            )}

            {technicalInfo[PROP_TELESCOPE] && (
              <Typography variant="body1" sx={{ mb: 1 }} color="text.primary">
                <Typography component="span" fontWeight="bold">
                  {t('telescope')}:
                </Typography>{' '}
                {technicalInfo[PROP_TELESCOPE]}
              </Typography>
            )}

            {technicalInfo[PROP_SPECTROSCOPY] && (
              <Box sx={{ mb: 1 }}>
                <Typography variant="body1" color="text.primary" fontWeight="bold">
                  {t('spectroscopy')}:
                </Typography>
                <AttachmentText
                  value={technicalInfo[PROP_SPECTROSCOPY]}
                  doiId={doiId}
                  previewTitle={t('spectroscopy')}
                />
              </Box>
            )}
            {technicalInfo[PROP_ASTROMETRY] && (
              <Box sx={{ mb: 1 }}>
                <Typography variant="body1" color="text.primary" fontWeight="bold">
                  {t('astrometry')}:
                </Typography>
                <AttachmentText
                  value={technicalInfo[PROP_ASTROMETRY]}
                  doiId={doiId}
                  previewTitle={t('astrometry')}
                />
              </Box>
            )}
          </Box>
        </Box>
      )}

      <Divider sx={{ my: 2 }} />

      {/* Miscellaneous Information */}
      {miscInfo && miscInfo[PROP_MISC] && miscInfo[PROP_MISC]?.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" color="text.primary">
            {t('miscellaneous_info')}
          </Typography>

          <Box sx={{ pl: 2 }}>
            {miscInfo[PROP_MISC].map((item, index) => (
              <Typography key={index} variant="body1" sx={{ mb: 1 }} color="text.primary">
                <Typography component="span" fontWeight="bold">
                  {item[PROP_MISC_KEY]}:
                </Typography>{' '}
                {item[PROP_MISC_VALUE]}
              </Typography>
            ))}
          </Box>
        </Box>
      )}

      <Divider sx={{ my: 2 }} />

      {/* Post Opt Out Checkbox */}
      <Box sx={{ mt: 2, mb: 1 }}>
        <FormControlLabel
          control={
            <Checkbox
              checked={raftData.generalInfo?.[PROP_POST_OPT_OUT] || false}
              onChange={(e) => onOptOutChange?.(e.target.checked)}
              color="primary"
              disabled={!onOptOutChange}
            />
          }
          label={t('opt_out_community_post')}
          sx={{
            '& .MuiFormControlLabel-label': {
              color: theme.palette.text.primary,
            },
          }}
        />
      </Box>
    </Paper>
  )
}

export default ReviewForm
