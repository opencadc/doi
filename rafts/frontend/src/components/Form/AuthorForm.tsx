'use client'
//Libs
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { TAuthor, authorSchema } from '@/shared/model'
import { useEffect, useMemo, useImperativeHandle, forwardRef } from 'react'

// Hooks
import { useTranslations } from 'next-intl'
import { useSectionTutorial } from '@/hooks/useSectionTutorial'

// Constants
import {
  PROP_CONTRIBUTING_AUTHORS,
  PROP_COLLABORATIONS,
  PROP_CORRESPONDING_AUTHOR,
  PROP_AUTHOR_FIRST_NAME,
  PROP_AUTHOR_LAST_NAME,
  PROP_AUTHOR_AFFILIATION,
  PROP_AUTHOR_EMAIL,
  PROP_AUTHOR_ORCID,
} from '@/shared/constants'
import { EMPTY_AUTHOR } from '@/components/Form/constants'

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

export interface AuthorFormRef {
  getCurrentValues: () => TAuthor
}

const AuthorForm = forwardRef<
  AuthorFormRef,
  {
    onSubmitAuthor: (values: TAuthor) => void
    formIsDirty: (value: boolean) => void
    onValidationChange?: (isValid: boolean) => void
    initialData?: TAuthor | null
  }
>(({ onSubmitAuthor, initialData = null, formIsDirty, onValidationChange }, ref) => {
  const t = useTranslations('submission_form')
  const tTutorial = useTranslations('tutorial')

  // Tutorial setup
  const { run, stepIndex, handleJoyrideCallback, startTutorial } = useSectionTutorial({
    sectionName: 'author',
    autoStart: false,
  })

  // Tutorial steps
  const tutorialSteps: Step[] = useMemo(
    () => [
      {
        target: '.author-section-header',
        content: tTutorial('author_section_welcome'),
        placement: 'bottom',
        disableBeacon: true,
      },
      {
        target: '.corresponding-author-section',
        content: tTutorial('author_corresponding'),
        placement: 'bottom',
      },
      {
        target: '.contributing-authors-section',
        content: tTutorial('author_contributing'),
        placement: 'bottom',
      },
      {
        target: '.collaborations-section',
        content: tTutorial('author_collaborations'),
        placement: 'bottom',
      },
      {
        target: '.add-author-button',
        content: tTutorial('author_add_button'),
        placement: 'top',
      },
      {
        target: '.save-author-button',
        content: tTutorial('author_save'),
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
    watch,
    setValue,
    getValues,
    formState: { errors, isDirty, isValid },
  } = useForm<TAuthor>({
    resolver: zodResolver(authorSchema),
    mode: 'onChange', // Enable validation on change
    defaultValues: initialData || {
      [PROP_CORRESPONDING_AUTHOR]: EMPTY_AUTHOR,
      [PROP_CONTRIBUTING_AUTHORS]: [],
      [PROP_COLLABORATIONS]: [],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: PROP_CONTRIBUTING_AUTHORS,
  })

  // Use watch to get the current collaborations value and manage manually
  const collaborations = watch(PROP_COLLABORATIONS) || []

  const appendCollaboration = (value: string) => {
    setValue(PROP_COLLABORATIONS, [...collaborations, value])
  }

  const removeCollaboration = (index: number) => {
    const newCollaborations = collaborations.filter((_, i) => i !== index)
    setValue(PROP_COLLABORATIONS, newCollaborations)
  }

  const collaborationFields = collaborations.map((value: string, index: number) => ({
    id: `collaboration-${index}`,
    value,
  }))

  // Reset form with initialData when it changes (e.g., navigating back to this step)
  useEffect(() => {
    if (initialData) {
      reset(initialData)
    }
  }, [initialData, reset])

  useEffect(() => {
    formIsDirty(isDirty)
  }, [isDirty, formIsDirty])

  // Notify parent about validation state changes
  useEffect(() => {
    onValidationChange?.(isValid)
  }, [isValid, onValidationChange])

  // Expose getCurrentValues via ref for parent to get form values before submit
  useImperativeHandle(ref, () => ({
    getCurrentValues: () => getValues(),
  }))

  const onSubmit = (data: TAuthor) => {
    onSubmitAuthor(data)
  }

  return (
    <>
      <SectionTutorial
        run={run}
        stepIndex={stepIndex}
        onCallback={handleJoyrideCallback}
        steps={tutorialSteps}
        sectionName="author"
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
          <h2 className="author-section-header text-lg font-bold text-center">
            {t('author_info')}
          </h2>

          {/* Corresponding Author */}
          <fieldset className="corresponding-author-section border p-4 rounded">
            <legend className="font-semibold">{t('cor_author')}</legend>

            <div>
              <InputFormField
                label={t('first_name')}
                error={!!errors[PROP_CORRESPONDING_AUTHOR]?.[PROP_AUTHOR_FIRST_NAME]}
                helperText={
                  errors[PROP_CORRESPONDING_AUTHOR]?.[PROP_AUTHOR_FIRST_NAME]
                    ? t(errors[PROP_CORRESPONDING_AUTHOR]?.[PROP_AUTHOR_FIRST_NAME]?.message)
                    : undefined
                }
                required={true}
                {...register(`${PROP_CORRESPONDING_AUTHOR}.${PROP_AUTHOR_FIRST_NAME}`, {
                  required: t('is_required'),
                })}
              />
            </div>

            <div>
              <InputFormField
                label={t('last_name')}
                error={!!errors[PROP_CORRESPONDING_AUTHOR]?.[PROP_AUTHOR_LAST_NAME]}
                helperText={
                  errors[PROP_CORRESPONDING_AUTHOR]?.[PROP_AUTHOR_LAST_NAME]
                    ? t(errors[PROP_CORRESPONDING_AUTHOR]?.[PROP_AUTHOR_LAST_NAME]?.message)
                    : undefined
                }
                required={true}
                {...register(`${PROP_CORRESPONDING_AUTHOR}.${PROP_AUTHOR_LAST_NAME}`, {
                  required: t('is_required'),
                })}
              />
            </div>
            <div>
              <InputFormField
                label={t('author_ORCID')}
                placeholder="0000-0000-0000-0000"
                error={!!errors[PROP_CORRESPONDING_AUTHOR]?.[PROP_AUTHOR_ORCID]}
                helperText={
                  errors[PROP_CORRESPONDING_AUTHOR]?.[PROP_AUTHOR_ORCID]
                    ? t(errors[PROP_CORRESPONDING_AUTHOR]?.[PROP_AUTHOR_ORCID]?.message)
                    : undefined
                }
                {...register(`${PROP_CORRESPONDING_AUTHOR}.${PROP_AUTHOR_ORCID}`)}
              />
            </div>

            <div>
              <InputFormField
                label={t('affiliation')}
                error={!!errors[PROP_CORRESPONDING_AUTHOR]?.[PROP_AUTHOR_AFFILIATION]}
                helperText={
                  errors[PROP_CORRESPONDING_AUTHOR]?.[PROP_AUTHOR_AFFILIATION]
                    ? t(errors[PROP_CORRESPONDING_AUTHOR]?.[PROP_AUTHOR_AFFILIATION]?.message)
                    : undefined
                }
                required={true}
                {...register(`${PROP_CORRESPONDING_AUTHOR}.${PROP_AUTHOR_AFFILIATION}`, {
                  required: t('is_required'),
                })}
              />
            </div>

            <div>
              <InputFormField
                label={t('email')}
                error={!!errors[PROP_CORRESPONDING_AUTHOR]?.[PROP_AUTHOR_EMAIL]}
                helperText={
                  errors[PROP_CORRESPONDING_AUTHOR]?.[PROP_AUTHOR_EMAIL]
                    ? t(errors[PROP_CORRESPONDING_AUTHOR]?.[PROP_AUTHOR_EMAIL]?.message)
                    : undefined
                }
                required={true}
                {...register(`${PROP_CORRESPONDING_AUTHOR}.${PROP_AUTHOR_EMAIL}`, {
                  required: t('is_required'),
                })}
              />
            </div>
          </fieldset>

          {/* Contributing Authors */}
          <fieldset className="contributing-authors-section border p-4 rounded">
            <legend className="font-semibold">{t('con_authors')}</legend>

            {fields.map((field, index) => (
              <div key={field.id} className="border p-2 rounded mb-2">
                <div>
                  <InputFormField
                    label={t('first_name')}
                    error={!!errors[PROP_CONTRIBUTING_AUTHORS]?.[index]?.[PROP_AUTHOR_FIRST_NAME]}
                    helperText={
                      errors[PROP_CONTRIBUTING_AUTHORS]?.[index]?.[PROP_AUTHOR_FIRST_NAME]
                        ? t(
                            errors[PROP_CONTRIBUTING_AUTHORS]?.[index]?.[PROP_AUTHOR_FIRST_NAME]
                              ?.message,
                          )
                        : undefined
                    }
                    required={true}
                    {...register(
                      `${PROP_CONTRIBUTING_AUTHORS}.${index}.${PROP_AUTHOR_FIRST_NAME}`,
                      {
                        required: t('is_required'),
                      },
                    )}
                  />
                </div>

                <div>
                  <InputFormField
                    label={t('last_name')}
                    error={!!errors[PROP_CONTRIBUTING_AUTHORS]?.[index]?.[PROP_AUTHOR_LAST_NAME]}
                    helperText={
                      errors[PROP_CONTRIBUTING_AUTHORS]?.[index]?.[PROP_AUTHOR_LAST_NAME]
                        ? t(
                            errors[PROP_CONTRIBUTING_AUTHORS]?.[index]?.[PROP_AUTHOR_LAST_NAME]
                              ?.message,
                          )
                        : undefined
                    }
                    required={true}
                    {...register(`${PROP_CONTRIBUTING_AUTHORS}.${index}.${PROP_AUTHOR_LAST_NAME}`, {
                      required: t('is_required'),
                    })}
                  />
                </div>
                <div>
                  <InputFormField
                    label={t('author_ORCID')}
                    placeholder="0000-0000-0000-0000"
                    error={!!errors[PROP_CONTRIBUTING_AUTHORS]?.[index]?.[PROP_AUTHOR_ORCID]}
                    helperText={
                      errors[PROP_CONTRIBUTING_AUTHORS]?.[index]?.[PROP_AUTHOR_ORCID]
                        ? t(
                            errors[PROP_CONTRIBUTING_AUTHORS]?.[index]?.[PROP_AUTHOR_ORCID]
                              ?.message,
                          )
                        : undefined
                    }
                    {...register(`${PROP_CONTRIBUTING_AUTHORS}.${index}.${PROP_AUTHOR_ORCID}`)}
                  />
                </div>

                <div>
                  <InputFormField
                    label={t('affiliation')}
                    error={!!errors[PROP_CONTRIBUTING_AUTHORS]?.[index]?.[PROP_AUTHOR_AFFILIATION]}
                    helperText={
                      errors[PROP_CONTRIBUTING_AUTHORS]?.[index]?.[PROP_AUTHOR_AFFILIATION]
                        ? t(
                            errors[PROP_CONTRIBUTING_AUTHORS]?.[index]?.[PROP_AUTHOR_AFFILIATION]
                              ?.message,
                          )
                        : undefined
                    }
                    required={true}
                    {...register(
                      `${PROP_CONTRIBUTING_AUTHORS}.${index}.${PROP_AUTHOR_AFFILIATION}`,
                      {
                        required: t('is_required'),
                      },
                    )}
                  />
                </div>

                <div>
                  <InputFormField
                    label={t('email')}
                    error={!!errors[PROP_CONTRIBUTING_AUTHORS]?.[index]?.[PROP_AUTHOR_EMAIL]}
                    helperText={
                      errors[PROP_CONTRIBUTING_AUTHORS]?.[index]?.[PROP_AUTHOR_EMAIL]
                        ? t(
                            errors[PROP_CONTRIBUTING_AUTHORS]?.[index]?.[PROP_AUTHOR_EMAIL]
                              ?.message,
                          )
                        : undefined
                    }
                    required={true}
                    {...register(`${PROP_CONTRIBUTING_AUTHORS}.${index}.${PROP_AUTHOR_EMAIL}`, {
                      required: t('is_required'),
                    })}
                  />
                </div>
                <div className={'flex justify-end'}>
                  <Button
                    size={'small'}
                    variant="text"
                    endIcon={<DeleteIcon />}
                    onClick={() => remove(index)}
                  >
                    {t('remove')}
                  </Button>
                </div>
              </div>
            ))}

            <Button
              className="add-author-button"
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => append(EMPTY_AUTHOR)}
            >
              {t('add_author')}
            </Button>
          </fieldset>

          {/* Collaborations */}
          <fieldset className="collaborations-section border p-4 rounded">
            <legend className="font-semibold">{t('collaborations')}</legend>

            {collaborationFields.map((field, index) => (
              <div
                key={field.id}
                className="border p-2 rounded flex flex-col items-start justify-start"
              >
                <InputFormField
                  label={t('collaboration_name')}
                  error={!!errors[PROP_COLLABORATIONS]?.[index]}
                  helperText={
                    errors[PROP_COLLABORATIONS]?.[index]
                      ? t(errors[PROP_COLLABORATIONS]?.[index]?.message)
                      : undefined
                  }
                  required={true}
                  {...register(`${PROP_COLLABORATIONS}.${index}`, {
                    required: t('is_required'),
                  })}
                />

                <Button
                  className="self-end"
                  size={'small'}
                  variant="text"
                  endIcon={<DeleteIcon />}
                  onClick={() => removeCollaboration(index)}
                >
                  {t('remove')}
                </Button>
              </div>
            ))}

            <Button
              className="add-collaboration-button"
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => appendCollaboration('')}
            >
              {t('add_collaboration')}
            </Button>
          </fieldset>

          <Button
            className="save-author-button"
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

AuthorForm.displayName = 'AuthorForm'

export default AuthorForm
