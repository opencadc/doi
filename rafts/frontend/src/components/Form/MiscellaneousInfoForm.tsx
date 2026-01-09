'use client'

import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { TMiscInfo, miscInfoSchema } from '@/shared/model'
import { useEffect, useMemo, useImperativeHandle, forwardRef } from 'react'

// Hooks
import { useTranslations } from 'next-intl'
import { useSectionTutorial } from '@/hooks/useSectionTutorial'

// Constants
import { PROP_MISC, PROP_MISC_KEY, PROP_MISC_VALUE } from '@/shared/constants'

// Components
import InputFormField from '@/components/Form/InputFormField'
import Button from '@mui/material/Button'
import DeleteIcon from '@mui/icons-material/Delete'
import AddIcon from '@mui/icons-material/Add'
import SaveIcon from '@mui/icons-material/Save'
import { Paper, IconButton, Tooltip } from '@mui/material'
import { HelpCircle } from 'lucide-react'
import SectionTutorial from '@/components/Tutorial/SectionTutorial'
import { Step } from 'react-joyride'

const EMPTY_MISC_ITEM = {
  [PROP_MISC_KEY]: '',
  [PROP_MISC_VALUE]: '',
}

export interface MiscellaneousInfoFormRef {
  getCurrentValues: () => TMiscInfo
}

const MiscellaneousInfoForm = forwardRef<
  MiscellaneousInfoFormRef,
  {
    onSubmitMiscellaneous: (values: TMiscInfo) => void
    formIsDirty: (value: boolean) => void
    initialData?: TMiscInfo | null
  }
>(({ onSubmitMiscellaneous, initialData = null, formIsDirty }, ref) => {
  const t = useTranslations('submission_form')
  const tTutorial = useTranslations('tutorial')

  // Tutorial setup
  const { run, stepIndex, handleJoyrideCallback, startTutorial } = useSectionTutorial({
    sectionName: 'misc',
    autoStart: false,
  })

  // Tutorial steps
  const tutorialSteps: Step[] = useMemo(
    () => [
      {
        target: '.misc-section-header',
        content: tTutorial('misc_section_welcome'),
        placement: 'bottom',
        disableBeacon: true,
      },
      {
        target: '.key-value-section',
        content: tTutorial('misc_key_value'),
        placement: 'bottom',
      },
      {
        target: '.add-misc-button',
        content: tTutorial('misc_additional_files'),
        placement: 'top',
      },
      {
        target: '.save-misc-button',
        content: tTutorial('misc_save'),
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
    getValues,
    formState: { errors, isDirty },
  } = useForm<TMiscInfo>({
    resolver: zodResolver(miscInfoSchema),
    defaultValues: initialData || {
      [PROP_MISC]: [],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: PROP_MISC,
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

  const onSubmit = (data: TMiscInfo) => {
    onSubmitMiscellaneous(data)
  }

  return (
    <>
      <SectionTutorial
        run={run}
        stepIndex={stepIndex}
        onCallback={handleJoyrideCallback}
        steps={tutorialSteps}
        sectionName="misc"
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
          <h2 className="misc-section-header text-lg font-bold text-center">
            {t('miscellaneous_info')}
          </h2>

          <div className="key-value-section flex flex-col gap-4">
            {fields.map((field, index) => (
              <div key={field.id} className="border p-4 rounded">
                <div className="space-y-4">
                  <InputFormField
                    label={t('misc_key')}
                    error={!!errors?.[PROP_MISC]?.[index]?.[PROP_MISC_KEY]}
                    helperText={
                      errors?.[PROP_MISC]?.[index]?.[PROP_MISC_KEY]
                        ? t(errors?.[PROP_MISC]?.[index]?.[PROP_MISC_KEY]?.message)
                        : t('misc_key_helper')
                    }
                    {...register(`${PROP_MISC}.${index}.${PROP_MISC_KEY}`)}
                  />

                  <InputFormField
                    label={t('misc_value')}
                    error={!!errors?.[PROP_MISC]?.[index]?.[PROP_MISC_VALUE]}
                    helperText={
                      errors?.[PROP_MISC]?.[index]?.[PROP_MISC_VALUE]
                        ? t(errors?.[PROP_MISC]?.[index]?.[PROP_MISC_VALUE]?.message)
                        : t('misc_value_helper')
                    }
                    {...register(`${PROP_MISC}.${index}.${PROP_MISC_VALUE}`)}
                  />

                  <div className="flex justify-end">
                    <Button
                      size="small"
                      variant="text"
                      endIcon={<DeleteIcon />}
                      onClick={() => remove(index)}
                    >
                      {t('remove')}
                    </Button>
                  </div>
                </div>
              </div>
            ))}

            <Button
              className="add-misc-button"
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => append(EMPTY_MISC_ITEM)}
            >
              {t('add_misc_item')}
            </Button>
          </div>

          <Button
            className="save-misc-button"
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

MiscellaneousInfoForm.displayName = 'MiscellaneousInfoForm'

export default MiscellaneousInfoForm
