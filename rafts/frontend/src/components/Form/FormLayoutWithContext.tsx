'use client'

import { useState, useEffect, useMemo, useCallback, lazy, Suspense, useRef } from 'react'
import FormNavigation from '@/components/Form/FormNavigation'
import ReviewForm from '@/components/Form/ReviewForm'
import { useRaftForm } from '@/context/RaftFormContext'
import {
  PROP_AUTHOR_INFO,
  PROP_OBSERVATION_INFO,
  PROP_TECHNICAL_INFO,
  PROP_MISC_INFO,
  FORM_SECTIONS,
  PROP_STATUS,
  OPTION_DRAFT,
  OPTION_REVIEW,
  PROP_TITLE,
  PROP_GENERAL_INFO,
  PROP_POST_OPT_OUT,
} from '@/shared/constants'
import { useTranslations } from 'next-intl'
import { Button, Alert, Snackbar, Grid } from '@mui/material'
import { useRouter } from '@/i18n/routing'
import { TAuthor, TMiscInfo, TObservation, TRaftSubmission, TTechInfo } from '@/shared/model'
import JsonImportComponent from '@/components/Form/FileUpload/JsonImportComponent'
import WarningDialog from '@/components/Layout/WarningDialog'
import { AttentionBanner } from '@/components/Layout/AttentionBanner'
import { FINAL_REVIEW_STEP, FORM_INFO, REVIEW_SECTION } from '@/components/Form/constants'
import { BACKEND_STATUS } from '@/shared/backendStatus'
import { VALIDATION_SCHEMAS } from '@/context/constants'
import { InputField } from '@/components/Form/InputFormField'
import { FormSectionLoader } from '@/components/Form/common/FormSectionLoader'
import { generalSchema } from '@/shared/model'
import type { AuthorFormRef } from '@/components/Form/AuthorForm'
import type { AnnouncementFormRef } from '@/components/Form/AnnouncementForm'
import type { ObservationInfoFormRef } from '@/components/Form/ObservationInfoForm'
import type { MiscellaneousInfoFormRef } from '@/components/Form/MiscellaneousInfoForm'

// Lazy load form sections for better performance
const AuthorForm = lazy(() => import('@/components/Form/AuthorForm'))
const AnnouncementForm = lazy(() => import('@/components/Form/AnnouncementForm'))
const ObservationInfoForm = lazy(() => import('@/components/Form/ObservationInfoForm'))
const MiscellaneousInfoForm = lazy(() => import('@/components/Form/MiscellaneousInfoForm'))

const DIRTY_FORM = FORM_SECTIONS.reduce(
  (cForm, section) => {
    cForm[section] = false
    return cForm
  },
  {} as { [key: string]: boolean },
)

const FormLayoutWithContext = () => {
  const [currentStep, setCurrentStep] = useState(0)
  const [alertOpen, setAlertOpen] = useState(false)
  const [alertMessage, setAlertMessage] = useState('')
  const [alertSeverity, setAlertSeverity] = useState<'success' | 'error' | 'warning' | 'info'>(
    'info',
  )
  const [formIsDirty, setFormIsDirty] = useState(DIRTY_FORM)
  const [warningModal, setIsWarningModalOpen] = useState({ isOpen: false, nextStep: 0 })
  const [cancelWarningOpen, setCancelWarningOpen] = useState(false)
  const [titleValue, setTitleValue] = useState('')
  const [postOptOut, setPostOptOut] = useState(false)
  const [isAuthorFormValid, setIsAuthorFormValid] = useState(false)
  const [isTitleValid, setIsTitleValid] = useState(false)
  const [submittingAction, setSubmittingAction] = useState<'draft' | 'submit' | null>(null)

  // Refs for form sections to get current values before submit
  const authorFormRef = useRef<AuthorFormRef>(null)
  const announcementFormRef = useRef<AnnouncementFormRef>(null)
  const observationFormRef = useRef<ObservationInfoFormRef>(null)
  const miscFormRef = useRef<MiscellaneousInfoFormRef>(null)

  const {
    raftData,
    isLoading,
    updateRaftSection,
    resetForm,
    submitForm,
    isSectionCompleted,
    allSectionsCompleted,
    setRaftErrors,
    doiIdentifier,
  } = useRaftForm()

  const router = useRouter()
  const t = useTranslations('submission_form')
  // Initialize title value and opt-out from raftData
  useEffect(() => {
    if (raftData?.[PROP_GENERAL_INFO]) {
      const title = raftData[PROP_GENERAL_INFO][PROP_TITLE] || ''
      setTitleValue(title)

      const optOut = raftData[PROP_GENERAL_INFO][PROP_POST_OPT_OUT] || false
      setPostOptOut(optOut)

      // Validate the initial title
      try {
        generalSchema.shape[PROP_TITLE].parse(title)
        setIsTitleValid(true)
      } catch {
        setIsTitleValid(false)
      }
    }
  }, [raftData])

  // Initialize author form validation state if there's existing data
  useEffect(() => {
    if (raftData?.[PROP_AUTHOR_INFO]) {
      setIsAuthorFormValid(isSectionCompleted(PROP_AUTHOR_INFO))
    }
  }, [raftData, isSectionCompleted])

  // Memoize form info messages to prevent recalculation
  const formInfoMessages = useMemo(
    () => FORM_INFO[FORM_SECTIONS[currentStep] ?? REVIEW_SECTION]?.messages.map((mKey) => t(mKey)),
    [currentStep, t],
  )

  // Note: We don't force navigation to incomplete sections anymore
  // Users can freely navigate between all sections regardless of completion status

  // Memoize completed steps array to prevent recreation
  const completedSteps = useMemo(
    () => [
      isSectionCompleted(PROP_AUTHOR_INFO),
      isSectionCompleted(PROP_OBSERVATION_INFO),
      isSectionCompleted(PROP_TECHNICAL_INFO),
      isSectionCompleted(PROP_MISC_INFO),
      false, // Review step
    ],
    [isSectionCompleted],
  )

  const changeStep = useCallback((step: number) => {
    // Allow free navigation to any step between 0 and FINAL_REVIEW_STEP
    if (step >= 0 && step <= FINAL_REVIEW_STEP) {
      setCurrentStep(step)
    }
  }, [])

  // Handle step changes
  const handleStepChange = useCallback(
    (step: number) => {
      // Get the current section name
      const currentSection =
        currentStep < FORM_SECTIONS.length ? FORM_SECTIONS[currentStep] : 'review'

      // Check if the current section is dirty (has unsaved changes)
      const currentSectionIsDirty =
        currentSection === 'review' ? false : formIsDirty[currentSection]

      // Also check if general info (title) is dirty
      const isGeneralInfoDirty = formIsDirty[PROP_GENERAL_INFO]

      // Only show warning if current section or general info has unsaved changes
      if (currentSectionIsDirty || isGeneralInfoDirty) {
        setIsWarningModalOpen({ isOpen: true, nextStep: step })
        return
      } else {
        setRaftErrors(PROP_GENERAL_INFO)
        changeStep(step)
      }
    },
    [formIsDirty, setRaftErrors, changeStep, currentStep],
  )

  // Handle title change - only updates local state
  const handleTitleChange = useCallback(
    (value: string) => {
      // Update local state immediately for responsive UI
      setTitleValue(value)

      // Mark general info as dirty if value differs from saved value
      if (value !== raftData?.[PROP_GENERAL_INFO]?.[PROP_TITLE]) {
        setFormIsDirty((prev) => ({ ...prev, [PROP_GENERAL_INFO]: true }))
      } else {
        setFormIsDirty((prev) => ({ ...prev, [PROP_GENERAL_INFO]: false }))
      }

      // Validate title using Zod schema
      try {
        generalSchema.shape[PROP_TITLE].parse(value)
        setIsTitleValid(true)
      } catch {
        setIsTitleValid(false)
      }
    },
    [raftData],
  )

  // Handle title blur - updates context
  const handleTitleBlur = useCallback(() => {
    // Only update if the value has changed
    if (titleValue !== raftData?.[PROP_GENERAL_INFO]?.[PROP_TITLE]) {
      updateRaftSection(PROP_GENERAL_INFO, {
        [PROP_TITLE]: titleValue,
        [PROP_POST_OPT_OUT]: postOptOut,
        [PROP_STATUS]: raftData?.[PROP_GENERAL_INFO]?.[PROP_STATUS] ?? OPTION_DRAFT,
      })
      setFormIsDirty((prev) => ({ ...prev, [PROP_GENERAL_INFO]: true }))

      setRaftErrors(PROP_GENERAL_INFO)
    }
  }, [titleValue, postOptOut, raftData, updateRaftSection, setRaftErrors, setFormIsDirty])

  // Handle opt-out checkbox change
  const handleOptOutChange = useCallback(
    (checked: boolean) => {
      setPostOptOut(checked)

      // Update immediately in context
      updateRaftSection(PROP_GENERAL_INFO, {
        [PROP_TITLE]: titleValue,
        [PROP_POST_OPT_OUT]: checked,
        [PROP_STATUS]: raftData?.[PROP_GENERAL_INFO]?.[PROP_STATUS] ?? OPTION_DRAFT,
      })

      // Mark as dirty
      setFormIsDirty((prev) => ({ ...prev, [PROP_GENERAL_INFO]: true }))
    },
    [titleValue, raftData, updateRaftSection, setFormIsDirty],
  )

  // Handle section save - updates form data in context and marks as clean
  const handleSectionSave = useCallback(
    (section: string) => {
      // Mark section as clean (saved)
      setFormIsDirty((prev) => ({ ...prev, [section]: false }))

      // Validate the section
      if (section in VALIDATION_SCHEMAS) {
        setRaftErrors(section as keyof typeof VALIDATION_SCHEMAS)
      }
    },
    [setRaftErrors],
  )

  // Memoized callbacks for form sections to prevent re-renders
  const handleAuthorSubmit = useCallback(
    (data: TAuthor) => {
      updateRaftSection(PROP_AUTHOR_INFO, data)
      handleSectionSave(PROP_AUTHOR_INFO)
    },
    [updateRaftSection, handleSectionSave],
  )

  const handleObservationSubmit = useCallback(
    (data: TObservation) => {
      updateRaftSection(PROP_OBSERVATION_INFO, data)
      handleSectionSave(PROP_OBSERVATION_INFO)
    },
    [updateRaftSection, handleSectionSave],
  )

  const handleTechnicalSubmit = useCallback(
    (data: TTechInfo) => {
      updateRaftSection(PROP_TECHNICAL_INFO, data)
      handleSectionSave(PROP_TECHNICAL_INFO)
    },
    [updateRaftSection, handleSectionSave],
  )

  const handleMiscellaneousSubmit = useCallback(
    (data: TMiscInfo) => {
      updateRaftSection(PROP_MISC_INFO, data)
      handleSectionSave(PROP_MISC_INFO)
    },
    [updateRaftSection, handleSectionSave],
  )

  // Memoized dirty handlers
  const handleAuthorDirty = useCallback(
    (isDirty: boolean) => setFormIsDirty((f) => ({ ...f, [PROP_AUTHOR_INFO]: isDirty })),
    [],
  )

  // Handle author form validation state
  const handleAuthorValidation = useCallback(
    (isValid: boolean) => setIsAuthorFormValid(isValid),
    [],
  )

  const handleObservationDirty = useCallback(
    (isDirty: boolean) => setFormIsDirty((f) => ({ ...f, [PROP_OBSERVATION_INFO]: isDirty })),
    [],
  )

  const handleTechnicalDirty = useCallback(
    (isDirty: boolean) => setFormIsDirty((f) => ({ ...f, [PROP_TECHNICAL_INFO]: isDirty })),
    [],
  )

  const handleMiscellaneousDirty = useCallback(
    (isDirty: boolean) => setFormIsDirty((f) => ({ ...f, [PROP_MISC_INFO]: isDirty })),
    [],
  )

  // Sync current form values to context before submit
  // This ensures "Save as Draft" captures unsaved form data
  const syncCurrentFormToContext = useCallback(() => {
    // Get current values from the active form section and sync to context
    switch (currentStep) {
      case 0: // Author form
        if (authorFormRef.current && formIsDirty[PROP_AUTHOR_INFO]) {
          const values = authorFormRef.current.getCurrentValues()
          updateRaftSection(PROP_AUTHOR_INFO, values)
        }
        break
      case 1: // Announcement/Observation form
        if (announcementFormRef.current && formIsDirty[PROP_OBSERVATION_INFO]) {
          const values = announcementFormRef.current.getCurrentValues()
          updateRaftSection(PROP_OBSERVATION_INFO, values)
        }
        break
      case 2: // Technical/Observation info form
        if (observationFormRef.current && formIsDirty[PROP_TECHNICAL_INFO]) {
          const values = observationFormRef.current.getCurrentValues()
          updateRaftSection(PROP_TECHNICAL_INFO, values)
        }
        break
      case 3: // Miscellaneous form
        if (miscFormRef.current && formIsDirty[PROP_MISC_INFO]) {
          const values = miscFormRef.current.getCurrentValues()
          updateRaftSection(PROP_MISC_INFO, values)
        }
        break
    }
  }, [currentStep, formIsDirty, updateRaftSection])

  // Handle form submission
  const handleSubmit = useCallback(
    async (isDraft = false) => {
      try {
        // Track which action is being performed
        setSubmittingAction(isDraft ? 'draft' : 'submit')

        // Sync current form values to context before submitting
        syncCurrentFormToContext()

        const res = await submitForm(isDraft)

        // Show success message
        if (res.success) {
          setAlertSeverity('success')
          setAlertMessage(t('submission_success'))
          setAlertOpen(true)

          // Mark all sections as clean after successful submission
          setFormIsDirty(DIRTY_FORM)
        } else if (!res.success) {
          setAlertSeverity('error')
          setAlertMessage(`${t('submission_error')} [${res.message}]`)
        }
        setAlertOpen(true)

        // Redirect after a delay
        if (!isDraft) {
          setTimeout(() => {
            router.push('/view/doi')
          }, 3000)
        }
      } catch {
        // Show error message
        setAlertSeverity('error')
        setAlertMessage(t('submission_error'))
        setAlertOpen(true)
      } finally {
        setSubmittingAction(null)
      }
    },
    [syncCurrentFormToContext, submitForm, t, router],
  )

  // Handle form reset
  const handleReset = useCallback(() => {
    if (window.confirm(t('confirm_reset'))) {
      resetForm()
      setCurrentStep(0)

      // Show info message
      setAlertSeverity('info')
      setAlertMessage(t('form_reset'))
      setAlertOpen(true)
    }
  }, [resetForm, t])

  // Check if any form section has unsaved changes
  const hasUnsavedChanges = useMemo(() => {
    return Object.values(formIsDirty).some((isDirty) => isDirty)
  }, [formIsDirty])

  // Handle cancel button click
  const handleCancel = useCallback(() => {
    if (hasUnsavedChanges) {
      setCancelWarningOpen(true)
    } else {
      router.push('/view/doi')
    }
  }, [hasUnsavedChanges, router])

  // Confirm cancel and navigate away
  const handleConfirmCancel = useCallback(() => {
    setCancelWarningOpen(false)
    router.push('/view/doi')
  }, [router])

  // Memoize subData to prevent recreation on every render
  const subData = useMemo(() => ({ ...raftData }) as unknown, [raftData])
  return (
    <div className="max-w-4xl mx-auto p-6">
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-center flex-1">{t('raft_form_title')}</h3>
            <Button
              variant="outlined"
              color="secondary"
              size="small"
              onClick={handleReset}
              className="ml-4"
            >
              {t('reset_form')}
            </Button>
            <JsonImportComponent />
          </div>

          <FormNavigation
            currentStep={currentStep}
            onStepChange={handleStepChange}
            completedSteps={completedSteps}
            title={
              <InputField
                label={t('title')}
                onChange={(event) => {
                  const value = event.target.value
                  handleTitleChange(value)
                }}
                onBlur={handleTitleBlur}
                error={!isTitleValid}
                helperText={!isTitleValid ? t('is_required') : undefined}
                required={true}
                value={titleValue}
              />
            }
          />
          {formInfoMessages?.length ? (
            <div className="mt-6">
              <AttentionBanner messages={formInfoMessages} />
            </div>
          ) : null}
          <Grid container className="mt-6 ">
            <Grid size={{ xs: 12, md: 9 }}>
              {currentStep === 0 && (
                <Suspense fallback={<FormSectionLoader />}>
                  <AuthorForm
                    ref={authorFormRef}
                    onSubmitAuthor={handleAuthorSubmit}
                    initialData={raftData?.[PROP_AUTHOR_INFO] as TAuthor}
                    formIsDirty={handleAuthorDirty}
                    onValidationChange={handleAuthorValidation}
                  />
                </Suspense>
              )}

              {currentStep === 1 && (
                <Suspense fallback={<FormSectionLoader />}>
                  <AnnouncementForm
                    ref={announcementFormRef}
                    onSubmitObservation={handleObservationSubmit}
                    initialData={raftData?.[PROP_OBSERVATION_INFO] as TObservation}
                    formIsDirty={handleObservationDirty}
                    doiIdentifier={doiIdentifier}
                  />
                </Suspense>
              )}

              {currentStep === 2 && (
                <Suspense fallback={<FormSectionLoader />}>
                  <ObservationInfoForm
                    ref={observationFormRef}
                    onSubmitTechnical={handleTechnicalSubmit}
                    initialData={raftData?.[PROP_TECHNICAL_INFO] as TTechInfo}
                    formIsDirty={handleTechnicalDirty}
                    doiIdentifier={doiIdentifier}
                  />
                </Suspense>
              )}

              {currentStep === 3 && (
                <Suspense fallback={<FormSectionLoader />}>
                  <MiscellaneousInfoForm
                    ref={miscFormRef}
                    onSubmitMiscellaneous={handleMiscellaneousSubmit}
                    initialData={raftData?.[PROP_MISC_INFO] as TMiscInfo}
                    formIsDirty={handleMiscellaneousDirty}
                  />
                </Suspense>
              )}
              {currentStep === 4 && (
                <ReviewForm
                  raftData={subData as TRaftSubmission}
                  onOptOutChange={handleOptOutChange}
                  doiId={doiIdentifier ?? undefined}
                />
              )}
            </Grid>
            <Grid size={{ xs: 12, md: 3 }} className="p-2 relative">
              <div className="flex flex-col justify-start align-top sticky top-0">
                {(() => {
                  const status = (subData as TRaftSubmission)?.[PROP_GENERAL_INFO]?.[PROP_STATUS]
                  // Show Save as Draft button for: no status, draft, in progress (backend's draft), or review
                  const showSaveAsDraft =
                    !status ||
                    status === OPTION_DRAFT ||
                    status === BACKEND_STATUS.IN_PROGRESS ||
                    status === OPTION_REVIEW
                  // Show Submit button for: no status, draft, or in progress (backend's draft)
                  const showSubmit =
                    !status || status === OPTION_DRAFT || status === BACKEND_STATUS.IN_PROGRESS

                  return (
                    <>
                      {showSaveAsDraft && (
                        <Button
                          variant="contained"
                          color="secondary"
                          size={'small'}
                          className="m-2 save-as-draft-button"
                          disabled={
                            submittingAction !== null ||
                            !isTitleValid ||
                            (currentStep === 0 && !isAuthorFormValid)
                          }
                          onClick={() => handleSubmit(true)}
                        >
                          {submittingAction === 'draft'
                            ? t('saving')
                            : t(status === OPTION_REVIEW ? 'revert_to_draft' : 'save_as_draft')}
                        </Button>
                      )}
                      {showSubmit && (
                        <Button
                          variant="contained"
                          color="primary"
                          disabled={!allSectionsCompleted || submittingAction !== null}
                          onClick={() => handleSubmit()}
                          size={'small'}
                          className="m-2 submit-button"
                        >
                          {submittingAction === 'submit' ? t('submitting') : t('submit')}
                        </Button>
                      )}
                      <Button
                        variant="outlined"
                        color="inherit"
                        size={'small'}
                        className="m-2 cancel-button"
                        onClick={handleCancel}
                      >
                        {t('cancel')}
                      </Button>
                    </>
                  )
                })()}
              </div>
            </Grid>
          </Grid>
          {/* Alert for notifications */}
          <Snackbar
            open={alertOpen}
            autoHideDuration={6000}
            onClose={() => setAlertOpen(false)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          >
            <Alert onClose={() => setAlertOpen(false)} severity={alertSeverity} variant="filled">
              {alertMessage}
            </Alert>
          </Snackbar>
        </>
      )}
      <WarningDialog
        isOpen={warningModal.isOpen}
        onCancel={() => setIsWarningModalOpen({ isOpen: false, nextStep: currentStep })}
        onOk={() => {
          setIsWarningModalOpen({ isOpen: false, nextStep: warningModal.nextStep })
          // Only clear the dirty state of the current section when navigating away
          const currentSection =
            currentStep < FORM_SECTIONS.length ? FORM_SECTIONS[currentStep] : 'review'
          setFormIsDirty((prev) => ({
            ...prev,
            [currentSection]: false,
            [PROP_GENERAL_INFO]: false, // Also clear general info (title) dirty state
          }))
          changeStep(warningModal.nextStep)
        }}
        options={{
          title: t('modal_changes_title'),
          message: t('modal_changes_message'),
          cancelCaption: t('modal_changes_cancel_caption'),
          okCaption: t('modal_changes_ok_caption'),
        }}
      />
      {/* Cancel confirmation dialog */}
      <WarningDialog
        isOpen={cancelWarningOpen}
        onCancel={() => setCancelWarningOpen(false)}
        onOk={handleConfirmCancel}
        options={{
          title: t('modal_cancel_title'),
          message: t('modal_cancel_message'),
          cancelCaption: t('modal_cancel_stay'),
          okCaption: t('modal_cancel_leave'),
        }}
      />
    </div>
  )
}

export default FormLayoutWithContext
