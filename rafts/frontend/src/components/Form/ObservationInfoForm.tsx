'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { TTechInfo, technicalInfoSchema } from '@/shared/model'
import { useEffect, useMemo, useImperativeHandle, forwardRef } from 'react'

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
import TextFileUpload from '@/components/Form/FileUpload/TextFileUpload'
import ADESFileUpload from '@/components/Form/FileUpload/ADESFileUpload'
import SectionTutorial from '@/components/Tutorial/SectionTutorial'
import { Step } from 'react-joyride'
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
    if (isDirty) {
      formIsDirty(isDirty)
    }
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
  const serializeAttachmentValue = (data: string | FileReference): string => {
    if (isFileReference(data)) {
      return JSON.stringify(data)
    }
    return data
  }

  const handleSpectrumLoaded = (data: string | FileReference) => {
    setValue(PROP_SPECTROSCOPY, serializeAttachmentValue(data))
  }

  const handleSpectrumClear = () => {
    setValue(PROP_SPECTROSCOPY, undefined)
  }

  const handleOrbitalLoaded = (data: string | FileReference) => {
    setValue(PROP_ORBITAL_ELEMENTS, serializeAttachmentValue(data))
  }

  const handleOrbitalClear = () => {
    setValue(PROP_ORBITAL_ELEMENTS, undefined)
  }

  const handleEphemerisLoaded = (data: string | FileReference) => {
    setValue(PROP_EPHEMERIS, serializeAttachmentValue(data))
  }

  const handleEphemerisClear = () => {
    setValue(PROP_EPHEMERIS, undefined)
  }

  const handleADESFileLoaded = (data: string | FileReference) => {
    setValue(PROP_ASTROMETRY, serializeAttachmentValue(data))
  }

  const handleADESFileClear = () => {
    setValue(PROP_ASTROMETRY, undefined)
  }

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
                    : undefined
                }
                {...register(`${PROP_PHOTOMETRY}.${PROP_WAVELENGTH}`)}
              />

              <InputFormField
                label={t('brightness')}
                error={!!errors.photometry?.brightness}
                helperText={
                  errors.photometry?.brightness
                    ? t(errors.photometry?.brightness?.message)
                    : undefined
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
          {/* MPC ID (Optional) */}
          <div className="coordinates-section">
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
            helperText={errors[PROP_ALERT_ID] ? t(errors[PROP_ALERT_ID]?.message) : undefined}
            {...register(PROP_ALERT_ID)}
          />

          {/* MJD (Optional) */}
          <InputFormField
            label={`${t('mjd')} (${t('optional')})`}
            type="text"
            error={!!errors[PROP_MJD]}
            helperText={errors[PROP_MJD] ? t(errors[PROP_MJD]?.message) : undefined}
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
              customFilename="astrometry.xml"
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
