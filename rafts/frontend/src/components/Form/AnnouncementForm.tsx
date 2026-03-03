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

import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { TObservation, observationSchema } from '@/shared/model'
import { useEffect, useMemo, useImperativeHandle, forwardRef } from 'react'

// Hooks
import { useTranslations } from 'next-intl'
import { useSectionTutorial } from '@/hooks/useSectionTutorial'

// Constants
import {
  PROP_TOPIC,
  PROP_OBJECT_NAME,
  PROP_ABSTRACT,
  PROP_FIGURE,
  PROP_ACKNOWLEDGEMENTS,
  TOPIC_OPTIONS,
  PROP_PREVIOUS_RAFTS,
} from '@/shared/constants'

// Components
import InputFormField from '@/components/Form/InputFormField'
import FileUploadImage from '@/components/Form/FileUpload/FileUploadImage'
import { FileReference, isFileReference, parseStoredAttachment } from '@/types/attachments'
import {
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  TextField,
  Divider,
  Typography,
  Box,
  Paper,
  OutlinedInput,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material'
import SaveIcon from '@mui/icons-material/Save'
import { HelpCircle } from 'lucide-react'
import dynamic from 'next/dynamic'
import { useTheme, Theme } from '@mui/material/styles'
import type { Step } from 'react-joyride'

const SectionTutorial = dynamic(() => import('@/components/Tutorial/SectionTutorial'), {
  ssr: false,
})

// Menu configuration for dropdown height/width
const ITEM_HEIGHT = 48
const ITEM_PADDING_TOP = 8
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 250,
    },
  },
}

// Style function for selected/unselected items
const getStyles = (name: string, selectedNames: readonly string[], theme: Theme) => {
  return {
    fontWeight: selectedNames.includes(name)
      ? theme.typography.fontWeightMedium
      : theme.typography.fontWeightRegular,
  }
}

export interface AnnouncementFormRef {
  getCurrentValues: () => TObservation
}

const AnnouncementForm = forwardRef<
  AnnouncementFormRef,
  {
    onSubmitObservation: (values: TObservation) => void
    formIsDirty: (value: boolean) => void
    initialData?: TObservation | null
    doiIdentifier?: string | null
  }
>(({ onSubmitObservation, initialData = null, formIsDirty, doiIdentifier }, ref) => {
  const theme = useTheme()
  const t = useTranslations('submission_form')
  const tTutorial = useTranslations('tutorial')

  // Tutorial setup
  const { run, stepIndex, handleJoyrideCallback, startTutorial } = useSectionTutorial({
    sectionName: 'announcement',
    autoStart: false,
  })

  // Tutorial steps
  const tutorialSteps: Step[] = useMemo(
    () => [
      {
        target: '.announcement-section-header',
        content: tTutorial('announcement_section_welcome'),
        placement: 'bottom',
        disableBeacon: true,
      },
      {
        target: '.topic-selector',
        content: tTutorial('announcement_topic'),
        placement: 'bottom',
      },
      {
        target: '.object-name-field',
        content: tTutorial('announcement_object'),
        placement: 'bottom',
      },
      {
        target: '.abstract-field',
        content: tTutorial('announcement_abstract'),
        placement: 'bottom',
      },
      {
        target: '.figure-upload',
        content: tTutorial('announcement_figure'),
        placement: 'top',
      },
      {
        target: '.save-announcement-button',
        content: tTutorial('announcement_save'),
        placement: 'top',
      },
    ],
    [tTutorial],
  )

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    watch,
    getValues,
    formState: { errors, isDirty },
  } = useForm<TObservation>({
    resolver: zodResolver(observationSchema),
    mode: 'onBlur',
    defaultValues: initialData || {
      [PROP_TOPIC]: undefined,
      [PROP_OBJECT_NAME]: '',
      [PROP_ABSTRACT]: '',
      [PROP_FIGURE]: '',
      [PROP_ACKNOWLEDGEMENTS]: '',
      [PROP_PREVIOUS_RAFTS]: '',
    },
  })

  // Watch the figure field to pass to the FileUploadImage component
  const figureValue = watch(PROP_FIGURE)

  // Reset form with initialData when it changes
  useEffect(() => {
    if (initialData) {
      reset(initialData)
    }
  }, [initialData, reset])

  useEffect(() => {
    formIsDirty(isDirty)
  }, [isDirty, formIsDirty])

  // Expose getCurrentValues via ref for parent to get form values before submit
  useImperativeHandle(ref, () => ({
    getCurrentValues: () => getValues(),
  }))

  const onSubmit = (data: TObservation) => {
    onSubmitObservation(data)
  }

  // Handle image upload - accepts both base64 string and FileReference
  const handleImageLoaded = (data: string | FileReference) => {
    if (isFileReference(data)) {
      // Store FileReference as JSON string in form field
      setValue(PROP_FIGURE, JSON.stringify(data), { shouldValidate: true })
    } else {
      setValue(PROP_FIGURE, data, { shouldValidate: true })
    }
  }

  // Handle image removal
  const handleImageClear = () => {
    setValue(PROP_FIGURE, '', { shouldValidate: true })
  }

  return (
    <>
      <SectionTutorial
        run={run}
        stepIndex={stepIndex}
        onCallback={handleJoyrideCallback}
        steps={tutorialSteps}
        sectionName="announcement"
      />
      <Paper className="relative">
        {/* Tutorial Help Button */}
        <div className="absolute top-2 right-2 z-10">
          <Tooltip title={tTutorial('section_help')} arrow>
            <IconButton
              size="small"
              onClick={startTutorial}
              sx={{
                color: 'text.secondary',
                '&:hover': {
                  color: 'primary.main',
                  backgroundColor: 'action.hover',
                },
              }}
            >
              <HelpCircle size={20} />
            </IconButton>
          </Tooltip>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-4 p-4 w-full max-w-lg mx-auto"
        >
          <h2 className="announcement-section-header text-lg font-bold text-center">
            {t('observation_info')}
          </h2>

          {/* Topic Selection */}
          <FormControl className="topic-selector" error={!!errors[PROP_TOPIC]} fullWidth required>
            <InputLabel id="topic-label">{t('topic')}</InputLabel>
            <Controller
              name={PROP_TOPIC}
              control={control}
              render={({ field }) => {
                // Ensure value is always an array
                const value = Array.isArray(field.value)
                  ? field.value
                  : field.value
                    ? [field.value]
                    : []

                return (
                  <Select
                    {...field}
                    value={value}
                    labelId="topic-label"
                    id="topic-select"
                    multiple
                    input={<OutlinedInput label={t('topic')} />}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {(selected as string[]).map((value) => (
                          <Chip key={value} label={t(value.toLowerCase())} size="small" />
                        ))}
                      </Box>
                    )}
                    MenuProps={MenuProps}
                    error={!!errors[PROP_TOPIC]}
                    required={true}
                  >
                    {TOPIC_OPTIONS.map((option) => {
                      return (
                        <MenuItem
                          key={option}
                          value={option}
                          style={getStyles(option, value, theme)}
                        >
                          {t(option.toLowerCase())}
                        </MenuItem>
                      )
                    })}
                  </Select>
                )
              }}
            />
            {errors[PROP_TOPIC] && (
              <FormHelperText>{t(errors[PROP_TOPIC]?.message)}</FormHelperText>
            )}
          </FormControl>

          {/* Object Name */}
          <InputFormField
            className="object-name-field"
            label={t('object_name')}
            error={!!errors[PROP_OBJECT_NAME]}
            helperText={errors[PROP_OBJECT_NAME] ? t(errors[PROP_OBJECT_NAME]?.message) : undefined}
            required={true}
            {...register(PROP_OBJECT_NAME, { required: t('is_required') })}
          />

          {/* Abstract */}
          <FormControl className="abstract-field" error={!!errors[PROP_ABSTRACT]}>
            <Controller
              name={PROP_ABSTRACT}
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label={t('abstract')}
                  multiline
                  minRows={4}
                  error={!!errors[PROP_ABSTRACT]}
                  helperText={errors[PROP_ABSTRACT] ? t(errors[PROP_ABSTRACT]?.message) : undefined}
                  required={true}
                  fullWidth
                />
              )}
            />
          </FormControl>

          {/* Figure Upload - Replacing the text input with image upload */}
          <Box sx={{ mt: 2, mb: 1 }}>
            <Divider>
              <Typography variant="caption" color="text.secondary">
                {t('figure_upload') || 'Figure Upload'}
              </Typography>
            </Divider>
          </Box>

          <div className="figure-upload">
            <FileUploadImage
              label={t('figure')}
              hint={t('figure_upload_hint')}
              onImageLoaded={handleImageLoaded}
              onClear={handleImageClear}
              initialImage={parseStoredAttachment(figureValue)}
              doiIdentifier={doiIdentifier || undefined}
              customFilename="figure"
            />
          </div>

          {errors[PROP_FIGURE] && (
            <FormHelperText error>
              {t(errors[PROP_FIGURE]?.message) || 'Error with the figure upload'}
            </FormHelperText>
          )}

          {/* Acknowledgements (Optional) */}
          <FormControl>
            <Controller
              name={PROP_ACKNOWLEDGEMENTS}
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label={`${t('acknowledgements')} (${t('optional')})`}
                  multiline
                  minRows={3}
                  fullWidth
                  helperText={t('acknowledgements_helper')}
                />
              )}
            />
          </FormControl>

          {/* Previously reported RAFTs */}
          <FormControl>
            <Controller
              name={PROP_PREVIOUS_RAFTS}
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label={`${t('previouslyPublishedRafts')} (${t('optional')})`}
                  fullWidth
                  helperText={t('previouslyPublishedRafts_helper')}
                />
              )}
            />
          </FormControl>

          {/* Submit Button */}
          <Button
            className="save-announcement-button"
            type="submit"
            variant="contained"
            startIcon={<SaveIcon />}
          >
            {t('save')}
          </Button>
        </form>
      </Paper>
    </>
  )
})

AnnouncementForm.displayName = 'AnnouncementForm'

export default AnnouncementForm
