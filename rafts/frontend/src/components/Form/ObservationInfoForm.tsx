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

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { TTechInfo, technicalInfoSchema } from '@/shared/model'
import { useEffect, useMemo, useImperativeHandle, forwardRef, useCallback } from 'react'

// Hooks
import { useTranslations } from 'next-intl'
import { useSectionTutorial } from '@/hooks/useSectionTutorial'

// Constants
import {
  PROP_EPHEMERIS,
  PROP_ORBITAL_ELEMENTS,
  PROP_MPC_ID,
  PROP_ALERT_ID,
  PROP_MJD,
  PROP_TELESCOPE,
  PROP_PHOTOMETRY,
  PROP_WAVELENGTH,
  PROP_BRIGHTNESS,
  PROP_ERRORS,
  PROP_SPECTROSCOPY,
  PROP_ASTROMETRY,
} from '@/shared/constants'

// Components
import InputFormField from '@/components/Form/InputFormField'
import Button from '@mui/material/Button'
import SaveIcon from '@mui/icons-material/Save'
import { FormHelperText, Paper, IconButton, Tooltip } from '@mui/material'
import { HelpCircle } from 'lucide-react'
import dynamic from 'next/dynamic'
import TextFileUpload from '@/components/Form/FileUpload/TextFileUpload'
import ADESFileUpload from '@/components/Form/FileUpload/ADESFileUpload'
import type { Step } from 'react-joyride'

const SectionTutorial = dynamic(() => import('@/components/Tutorial/SectionTutorial'), {
  ssr: false,
})
import { FileReference, isFileReference, parseStoredAttachment } from '@/types/attachments'

export interface ObservationInfoFormRef {
  getCurrentValues: () => TTechInfo
}

const ObservationInfoForm = forwardRef<
  ObservationInfoFormRef,
  {
    onSubmitTechnical: (values: TTechInfo) => void
    formIsDirty: (value: boolean) => void
    initialData?: TTechInfo | null
    doiIdentifier?: string | null
  }
>(({ onSubmitTechnical, initialData = null, formIsDirty, doiIdentifier }, ref) => {
  const t = useTranslations('submission_form')
  const tTutorial = useTranslations('tutorial')

  // Tutorial setup
  const { run, stepIndex, handleJoyrideCallback, startTutorial } = useSectionTutorial({
    sectionName: 'observation',
    autoStart: false,
  })

  // Tutorial steps
  const tutorialSteps: Step[] = useMemo(
    () => [
      {
        target: '.observation-section-header',
        content: tTutorial('observation_section_welcome'),
        placement: 'bottom',
        disableBeacon: true,
      },
      {
        target: '.coordinates-section',
        content: tTutorial('observation_coordinates'),
        placement: 'bottom',
      },
      {
        target: '.brightness-section',
        content: tTutorial('observation_brightness'),
        placement: 'bottom',
      },
      {
        target: '.telescope-field',
        content: tTutorial('observation_telescope'),
        placement: 'bottom',
      },
      {
        target: '.observation-files',
        content: tTutorial('observation_files'),
        placement: 'top',
      },
      {
        target: '.save-observation-button',
        content: tTutorial('observation_save'),
        placement: 'top',
      },
    ],
    [tTutorial],
  )

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    getValues,
    formState: { errors, isDirty },
  } = useForm<TTechInfo>({
    resolver: zodResolver(technicalInfoSchema),
    mode: 'onBlur',
    defaultValues: initialData || {
      [PROP_PHOTOMETRY]: {
        [PROP_WAVELENGTH]: '',
        [PROP_BRIGHTNESS]: '',
        [PROP_ERRORS]: '',
      },
      [PROP_EPHEMERIS]: '',
      [PROP_ORBITAL_ELEMENTS]: '',
      [PROP_MPC_ID]: '',
      [PROP_ALERT_ID]: '',
      [PROP_MJD]: '',
      [PROP_TELESCOPE]: '',
      [PROP_SPECTROSCOPY]: '',
      [PROP_ASTROMETRY]: '',
    },
  })

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

  const orbitalElementsValue = watch(PROP_ORBITAL_ELEMENTS)
  const ephemerisValue = watch(PROP_EPHEMERIS)
  const spectrumValue = watch(PROP_SPECTROSCOPY)
  const astrometryValue = watch(PROP_ASTROMETRY)
  const onSubmit = (data: TTechInfo) => {
    onSubmitTechnical(data)
  }

  // Helper to serialize attachment value for form storage
  const serializeAttachmentValue = useCallback((data: string | FileReference): string => {
    if (isFileReference(data)) {
      return JSON.stringify(data)
    }
    return data
  }, [])

  const handleSpectrumLoaded = useCallback(
    (data: string | FileReference) => {
      setValue(PROP_SPECTROSCOPY, serializeAttachmentValue(data))
    },
    [setValue, serializeAttachmentValue],
  )

  const handleSpectrumClear = useCallback(() => {
    setValue(PROP_SPECTROSCOPY, undefined)
  }, [setValue])

  const handleOrbitalLoaded = useCallback(
    (data: string | FileReference) => {
      setValue(PROP_ORBITAL_ELEMENTS, serializeAttachmentValue(data))
    },
    [setValue, serializeAttachmentValue],
  )

  const handleOrbitalClear = useCallback(() => {
    setValue(PROP_ORBITAL_ELEMENTS, undefined)
  }, [setValue])

  const handleEphemerisLoaded = useCallback(
    (data: string | FileReference) => {
      setValue(PROP_EPHEMERIS, serializeAttachmentValue(data))
    },
    [setValue, serializeAttachmentValue],
  )

  const handleEphemerisClear = useCallback(() => {
    setValue(PROP_EPHEMERIS, undefined)
  }, [setValue])

  const handleADESFileLoaded = useCallback(
    (data: string | FileReference) => {
      setValue(PROP_ASTROMETRY, serializeAttachmentValue(data))
    },
    [setValue, serializeAttachmentValue],
  )

  const handleADESFileClear = useCallback(() => {
    setValue(PROP_ASTROMETRY, undefined)
  }, [setValue])

  return (
    <>
      <SectionTutorial
        run={run}
        stepIndex={stepIndex}
        onCallback={handleJoyrideCallback}
        steps={tutorialSteps}
        sectionName="observation"
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
          <h2 className="observation-section-header text-lg font-bold text-center">
            {t('technical_info')}
          </h2>

          {/* Photometry Section */}
          <fieldset className="brightness-section border p-4 rounded">
            <legend className="font-semibold">{t('photometry')}</legend>

            <div className="space-y-4">
              <InputFormField
                label={t('wavelength')}
                error={!!errors.photometry?.wavelength}
                helperText={
                  errors.photometry?.wavelength
                    ? t(errors.photometry?.wavelength?.message)
                    : t('wavelength_helper')
                }
                {...register(`${PROP_PHOTOMETRY}.${PROP_WAVELENGTH}`)}
              />

              <InputFormField
                label={t('brightness')}
                error={!!errors.photometry?.brightness}
                helperText={
                  errors.photometry?.brightness
                    ? t(errors.photometry?.brightness?.message)
                    : t('brightness_helper')
                }
                {...register(`${PROP_PHOTOMETRY}.${PROP_BRIGHTNESS}`)}
              />

              <InputFormField
                label={`${t('errors')} (${t('optional')})`}
                error={!!errors.photometry?.errors}
                helperText={
                  errors.photometry?.errors ? t(errors.photometry?.errors?.message) : undefined
                }
                {...register(`${PROP_PHOTOMETRY}.${PROP_ERRORS}`)}
              />
            </div>
          </fieldset>
          {/* Identifiers Section */}
          <div className="coordinates-section">
            <p className="text-sm text-gray-500 mb-2">{t('identifiers_helper')}</p>
            {/* MPC ID (Optional) */}
            <InputFormField
              label={`${t('mpc_id')} (${t('optional')})`}
              error={!!errors[PROP_MPC_ID]}
              helperText={errors[PROP_MPC_ID] ? t(errors[PROP_MPC_ID]?.message) : undefined}
              {...register(PROP_MPC_ID)}
            />
          </div>

          {/* Alert ID (Optional) */}
          <InputFormField
            label={`${t('alert_id')} (${t('optional')})`}
            error={!!errors[PROP_ALERT_ID]}
            helperText={
              errors[PROP_ALERT_ID] ? t(errors[PROP_ALERT_ID]?.message) : t('alert_id_helper')
            }
            {...register(PROP_ALERT_ID)}
          />

          {/* MJD (Optional) */}
          <InputFormField
            label={`${t('mjd')} (${t('optional')})`}
            type="text"
            error={!!errors[PROP_MJD]}
            helperText={errors[PROP_MJD] ? t(errors[PROP_MJD]?.message) : t('mjd_helper')}
            {...register(PROP_MJD)}
          />

          {/* Telescope (Optional) */}
          <InputFormField
            className="telescope-field"
            label={`${t('telescope')} (${t('instrument')}) (${t('optional')})`}
            error={!!errors[PROP_TELESCOPE]}
            helperText={errors[PROP_TELESCOPE] ? t(errors[PROP_TELESCOPE]?.message) : undefined}
            {...register(PROP_TELESCOPE)}
          />
          {/* File Upload Section */}
          <p className="text-sm text-gray-500">{t('multiple_observations_helper')}</p>
          <div className="observation-files">
            {/* Ephemeris (Optional) */}
            <TextFileUpload
              label={t('ephemeris')}
              hint={t('ephemeris_upload_hint')}
              onFileLoaded={handleEphemerisLoaded}
              onClear={handleEphemerisClear}
              initialText={parseStoredAttachment(ephemerisValue)}
              doiIdentifier={doiIdentifier || undefined}
              customFilename="ephemeris.txt"
            />
            <FormHelperText>
              {errors[PROP_EPHEMERIS] ? t(errors[PROP_EPHEMERIS]?.message) : undefined}
            </FormHelperText>

            {/* Orbital Elements (Optional) */}
            <TextFileUpload
              label={t('orbital_elements')}
              hint={t('orbital_elements_upload_hint')}
              onFileLoaded={handleOrbitalLoaded}
              onClear={handleOrbitalClear}
              initialText={parseStoredAttachment(orbitalElementsValue)}
              doiIdentifier={doiIdentifier || undefined}
              customFilename="orbital.txt"
            />
            <FormHelperText>
              {errors[PROP_ORBITAL_ELEMENTS]
                ? t(errors[PROP_ORBITAL_ELEMENTS]?.message)
                : undefined}
            </FormHelperText>
            {/*Spectrum File upload*/}
            <TextFileUpload
              label={t('spectrum_file')}
              hint={t('spectrum_upload_hint')}
              onFileLoaded={handleSpectrumLoaded}
              onClear={handleSpectrumClear}
              initialText={parseStoredAttachment(spectrumValue)}
              doiIdentifier={doiIdentifier || undefined}
              customFilename="spectrum.txt"
            />

            {/*Astrometry as ADES File upload*/}
            <ADESFileUpload
              label={t('astrometry_file')}
              hint={t('ades_upload_hint')}
              onFileUpload={handleADESFileLoaded}
              onClear={handleADESFileClear}
              initialText={parseStoredAttachment(astrometryValue)}
              doiIdentifier={doiIdentifier || undefined}
            />
          </div>

          {/* Submit Button */}
          <Button
            className="save-observation-button"
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

ObservationInfoForm.displayName = 'ObservationInfoForm'

export default ObservationInfoForm
