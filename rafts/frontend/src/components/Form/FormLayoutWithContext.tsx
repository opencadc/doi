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

import {
  useState,
  useEffect,
  useMemo,
  useCallback,
  lazy,
  Suspense,
  useRef,
  useReducer,
  memo,
} from 'react'
import FormNavigation from '@/components/Form/FormNavigation'
import ReviewForm from '@/components/Form/ReviewForm'
import { useRaftForm } from '@/context/RaftFormContext'
import {
  PROP_AUTHOR_INFO,
  PROP_OBSERVATION_INFO,
  PROP_TECHNICAL_INFO,
  PROP_MISC_INFO,
  PROP_MISC,
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
import RaftBreadcrumbs from '@/components/RaftDetail/components/RaftBreadcrumbs'
import { useRouter } from '@/i18n/routing'
import { TAuthor, TMiscInfo, TObservation, TRaftSubmission, TTechInfo } from '@/shared/model'
import JsonImportComponent from '@/components/Form/FileUpload/JsonImportComponent'
import WarningDialog from '@/components/Layout/WarningDialog'
import { AttentionBanner } from '@/components/Layout/AttentionBanner'
import { FINAL_REVIEW_STEP, FORM_INFO, REVIEW_SECTION } from '@/components/Form/constants'
import { BACKEND_STATUS } from '@/shared/backendStatus'
import { Paper, Typography, Chip } from '@mui/material'
import { VALIDATION_SCHEMAS } from '@/context/constants'
import { InputField } from '@/components/Form/InputFormField'
import { FormSectionLoader } from '@/components/Form/common/FormSectionLoader'
import { generalSchema } from '@/shared/model'
import type { AuthorFormRef } from '@/components/Form/AuthorForm'
import type { AnnouncementFormRef } from '@/components/Form/AnnouncementForm'
import type { ObservationInfoFormRef } from '@/components/Form/ObservationInfoForm'
import type { MiscellaneousInfoFormRef } from '@/components/Form/MiscellaneousInfoForm'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

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

type AlertSeverity = 'success' | 'error' | 'warning' | 'info'

interface AlertState {
  open: boolean
  message: string
  severity: AlertSeverity
}

type AlertAction = { type: 'show'; severity: AlertSeverity; message: string } | { type: 'close' }

function alertReducer(state: AlertState, action: AlertAction): AlertState {
  switch (action.type) {
    case 'show':
      return { open: true, severity: action.severity, message: action.message }
    case 'close':
      return { ...state, open: false }
  }
}

// Schema for title-only validation (used by TitleInput's RHF instance)
const titleSchema = z.object({
  [PROP_TITLE]: generalSchema.shape[PROP_TITLE],
})

// Isolated title input — uses RHF register() for uncontrolled input (zero re-renders during typing)
const TitleInput = memo(function TitleInput({
  savedTitle,
  onBlur,
  label,
  errorText,
  helperText,
  required,
}: {
  savedTitle: string
  onBlur: (value: string) => void
  label: string
  errorText: string
  helperText: string
  required: boolean
}) {
  const {
    register,
    formState: { errors },
    reset,
  } = useForm({
    mode: 'onBlur',
    resolver: zodResolver(titleSchema),
    defaultValues: { [PROP_TITLE]: savedTitle },
  })

  // Sync when saved data changes externally (load, import, reset)
  useEffect(() => {
    reset({ [PROP_TITLE]: savedTitle })
  }, [savedTitle, reset])

  const { ref, ...titleField } = register(PROP_TITLE, {
    onBlur: (e) => onBlur(e.target.value),
  })

  return (
    <InputField
      inputRef={ref}
      {...titleField}
      label={label}
      error={!!errors[PROP_TITLE]}
      helperText={errors[PROP_TITLE] ? errorText : helperText}
      required={required}
    />
  )
})

const FormLayoutWithContext = () => {
  const [currentStep, setCurrentStep] = useState(0)
  const [alert, dispatchAlert] = useReducer(alertReducer, {
    open: false,
    message: '',
    severity: 'info' as AlertSeverity,
  })
  const [formIsDirty, setFormIsDirty] = useState(DIRTY_FORM)
  const [warningModal, setIsWarningModalOpen] = useState({ isOpen: false, nextStep: 0 })
  const [cancelWarningOpen, setCancelWarningOpen] = useState(false)
  const [resetWarningOpen, setResetWarningOpen] = useState(false)
  const [postOptOut, setPostOptOut] = useState(false)
  const [isTitleValid, setIsTitleValid] = useState(false)
  const [submittingAction, setSubmittingAction] = useState<'draft' | 'submit' | null>(null)

  // Refs to read current title/optOut in handlers without state deps
  const titleValueRef = useRef('')
  const postOptOutRef = useRef(postOptOut)
  postOptOutRef.current = postOptOut

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
    validateSection,
    validateAllSections,
    doiIdentifier,
  } = useRaftForm()

  const router = useRouter()
  const t = useTranslations('submission_form')

  // Derive stable reference for narrowed effect deps
  const generalInfo = raftData?.[PROP_GENERAL_INFO]

  // Initialize opt-out and title ref from raftData - only when generalInfo changes
  // TitleInput handles its own value sync via savedTitle prop
  useEffect(() => {
    if (generalInfo) {
      titleValueRef.current = generalInfo[PROP_TITLE] || ''

      const optOut = generalInfo[PROP_POST_OPT_OUT] || false
      setPostOptOut(optOut)

      try {
        generalSchema.shape[PROP_TITLE].parse(generalInfo[PROP_TITLE] || '')
        setIsTitleValid(true)
      } catch {
        setIsTitleValid(false)
      }
    }
  }, [generalInfo])

  // Memoize form info messages to prevent recalculation
  const formInfoMessages = useMemo(
    () => FORM_INFO[FORM_SECTIONS[currentStep] ?? REVIEW_SECTION]?.messages.map((mKey) => t(mKey)),
    [currentStep, t],
  )

  // Note: We don't force navigation to incomplete sections anymore
  // Users can freely navigate between all sections regardless of completion status

  // Memoize completed steps array to prevent recreation
  // Misc Info: only show green check if user actually added data
  const hasMiscData = useMemo(() => {
    const miscInfo = raftData?.[PROP_MISC_INFO] as TMiscInfo | undefined
    const miscArray = miscInfo?.[PROP_MISC]
    return Array.isArray(miscArray) && miscArray.some((item) => item.miscKey || item.miscValue)
  }, [raftData])

  const completedSteps = useMemo(
    () => [
      isSectionCompleted(PROP_AUTHOR_INFO),
      isSectionCompleted(PROP_OBSERVATION_INFO),
      isSectionCompleted(PROP_TECHNICAL_INFO),
      hasMiscData && isSectionCompleted(PROP_MISC_INFO),
      false, // Review step
    ],
    [isSectionCompleted, hasMiscData],
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
        changeStep(step)
      }
    },
    [formIsDirty, changeStep, currentStep],
  )

  // Called by TitleInput on blur — receives the current value
  const handleTitleBlur = useCallback(
    (value: string) => {
      titleValueRef.current = value

      try {
        generalSchema.shape[PROP_TITLE].parse(value)
        setIsTitleValid(true)
      } catch {
        setIsTitleValid(false)
      }

      if (value !== raftData?.[PROP_GENERAL_INFO]?.[PROP_TITLE]) {
        updateRaftSection(PROP_GENERAL_INFO, {
          [PROP_TITLE]: value,
          [PROP_POST_OPT_OUT]: postOptOutRef.current,
          [PROP_STATUS]: raftData?.[PROP_GENERAL_INFO]?.[PROP_STATUS] ?? OPTION_DRAFT,
        })
        setFormIsDirty((prev) => ({ ...prev, [PROP_GENERAL_INFO]: false }))
      }
    },
    [raftData, updateRaftSection, setFormIsDirty],
  )

  // Handle opt-out checkbox change
  const handleOptOutChange = useCallback(
    (checked: boolean) => {
      setPostOptOut(checked)

      updateRaftSection(PROP_GENERAL_INFO, {
        [PROP_TITLE]: titleValueRef.current,
        [PROP_POST_OPT_OUT]: checked,
        [PROP_STATUS]: raftData?.[PROP_GENERAL_INFO]?.[PROP_STATUS] ?? OPTION_DRAFT,
      })

      setFormIsDirty((prev) => ({ ...prev, [PROP_GENERAL_INFO]: true }))
    },
    [raftData, updateRaftSection, setFormIsDirty],
  )

  // Handle section save - updates form data in context, marks as clean, and validates
  const handleSectionSave = useCallback(
    (section: string) => {
      setFormIsDirty((prev) => ({ ...prev, [section]: false }))

      // Validate the section on save (user clicked Save button)
      if (section in VALIDATION_SCHEMAS) {
        validateSection(section as keyof typeof VALIDATION_SCHEMAS)
      }
    },
    [validateSection],
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
  // Returns the synced data directly to avoid async state race condition
  // Always reads current values from the active form ref regardless of dirty state,
  // since dirty tracking is unreliable for gating saves (some forms only report dirty=true, never false)
  const syncCurrentFormToContext = useCallback(() => {
    // Start with current raftData
    let syncedData = { ...raftData }

    // Get current values from the active form section and sync to context
    switch (currentStep) {
      case 0: // Author form
        if (authorFormRef.current) {
          const values = authorFormRef.current.getCurrentValues()
          syncedData = { ...syncedData, [PROP_AUTHOR_INFO]: values }
          updateRaftSection(PROP_AUTHOR_INFO, values)
        }
        break
      case 1: // Announcement/Observation form
        if (announcementFormRef.current) {
          const values = announcementFormRef.current.getCurrentValues()
          syncedData = { ...syncedData, [PROP_OBSERVATION_INFO]: values }
          updateRaftSection(PROP_OBSERVATION_INFO, values)
        }
        break
      case 2: // Technical/Observation info form
        if (observationFormRef.current) {
          const values = observationFormRef.current.getCurrentValues()
          syncedData = { ...syncedData, [PROP_TECHNICAL_INFO]: values }
          updateRaftSection(PROP_TECHNICAL_INFO, values)
        }
        break
      case 3: // Miscellaneous form
        if (miscFormRef.current) {
          const values = miscFormRef.current.getCurrentValues()
          syncedData = { ...syncedData, [PROP_MISC_INFO]: values }
          updateRaftSection(PROP_MISC_INFO, values)
        }
        break
    }

    // Always sync title and opt-out values to capture any unsaved changes
    syncedData = {
      ...syncedData,
      [PROP_GENERAL_INFO]: {
        ...syncedData[PROP_GENERAL_INFO],
        [PROP_TITLE]: titleValueRef.current,
        [PROP_POST_OPT_OUT]: postOptOutRef.current,
        [PROP_STATUS]: syncedData[PROP_GENERAL_INFO]?.[PROP_STATUS] ?? OPTION_DRAFT,
      },
    }

    return syncedData
  }, [currentStep, updateRaftSection, raftData])

  // Handle form submission
  const handleSubmit = useCallback(
    async (isDraft = false) => {
      try {
        setSubmittingAction(isDraft ? 'draft' : 'submit')

        const isNewRaft = !raftData?.id
        const syncedData = syncCurrentFormToContext()

        // For full submit (not draft), validate all sections first
        if (!isDraft) {
          const allValid = validateAllSections(syncedData)
          if (!allValid) {
            dispatchAlert({
              type: 'show',
              severity: 'warning',
              message: t('validation_incomplete'),
            })
            setSubmittingAction(null)
            return
          }
        } else {
          // For draft, validate general info (title required) and current section
          validateSection(PROP_GENERAL_INFO)
        }

        const res = await submitForm(isDraft, syncedData)

        if (res.success) {
          dispatchAlert({ type: 'show', severity: 'success', message: t('submission_success') })
          setFormIsDirty(DIRTY_FORM)

          if (isDraft && isNewRaft && res.data) {
            const newId = typeof res.data === 'string' ? res.data.split('/').pop() : null
            if (newId) {
              router.replace(`/form/edit/${newId}`)
            }
          }
        } else {
          dispatchAlert({
            type: 'show',
            severity: 'error',
            message: `${t('submission_error')} [${res.message}]`,
          })
        }

        if (!isDraft) {
          setTimeout(() => {
            router.push('/view/rafts')
          }, 3000)
        }
      } catch {
        dispatchAlert({ type: 'show', severity: 'error', message: t('submission_error') })
      } finally {
        setSubmittingAction(null)
      }
    },
    [
      syncCurrentFormToContext,
      submitForm,
      t,
      router,
      raftData?.id,
      validateAllSections,
      validateSection,
    ],
  )

  // Handle form reset - opens confirmation dialog
  const handleReset = useCallback(() => {
    setResetWarningOpen(true)
  }, [])

  // Confirm reset action
  const confirmReset = useCallback(() => {
    setResetWarningOpen(false)
    resetForm()
    setCurrentStep(0)
    setFormIsDirty(DIRTY_FORM)
    titleValueRef.current = ''
    setPostOptOut(false)
    setIsTitleValid(false)
    dispatchAlert({ type: 'show', severity: 'info', message: t('form_reset') })
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
      router.push('/view/rafts')
    }
  }, [hasUnsavedChanges, router])

  // Confirm cancel and navigate away
  const handleConfirmCancel = useCallback(() => {
    setCancelWarningOpen(false)
    router.push('/view/rafts')
  }, [router])

  // Determine breadcrumb title based on create vs edit mode
  const breadcrumbTitle = useMemo(() => {
    if (raftData?.id) {
      const title = generalInfo?.[PROP_TITLE]
      return title ? `${t('edit')}: ${title}` : t('edit_raft')
    }
    return t('create_new_raft')
  }, [raftData?.id, generalInfo, t])

  const handleSaveDraft = useCallback(() => handleSubmit(true), [handleSubmit])
  const handleSubmitFinal = useCallback(() => handleSubmit(), [handleSubmit])
  const handleAlertClose = useCallback(() => dispatchAlert({ type: 'close' }), [])

  // Memoize button visibility to avoid recalculating in JSX
  const currentStatus = generalInfo?.[PROP_STATUS]
  const showSaveAsDraft = useMemo(
    () =>
      !currentStatus ||
      currentStatus === OPTION_DRAFT ||
      currentStatus === BACKEND_STATUS.IN_PROGRESS ||
      currentStatus === OPTION_REVIEW,
    [currentStatus],
  )
  const showSubmit = useMemo(
    () =>
      !currentStatus ||
      currentStatus === OPTION_DRAFT ||
      currentStatus === BACKEND_STATUS.IN_PROGRESS,
    [currentStatus],
  )
  const draftButtonLabel = useMemo(
    () =>
      submittingAction === 'draft'
        ? t('saving')
        : t(currentStatus === OPTION_REVIEW ? 'revert_to_draft' : 'save_as_draft'),
    [submittingAction, currentStatus, t],
  )

  return (
    <div className="max-w-4xl mx-auto p-6">
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <>
          <RaftBreadcrumbs title={breadcrumbTitle} basePath="/view/rafts" />
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-center flex-1">{t('raft_form_title')}</h3>
            <JsonImportComponent />
          </div>

          <FormNavigation
            currentStep={currentStep}
            onStepChange={handleStepChange}
            completedSteps={completedSteps}
            title={
              <TitleInput
                savedTitle={generalInfo?.[PROP_TITLE] || ''}
                onBlur={handleTitleBlur}
                label={t('title')}
                errorText={t('is_required')}
                helperText={t('title_helper')}
                required={true}
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
                    doiIdentifier={doiIdentifier}
                  />
                </Suspense>
              )}
              {currentStep === 4 && (
                <ReviewForm
                  raftData={raftData as TRaftSubmission}
                  onOptOutChange={handleOptOutChange}
                  doiId={doiIdentifier ?? undefined}
                />
              )}
            </Grid>
            <Grid size={{ xs: 12, md: 3 }} className="p-2 relative">
              <div className="flex flex-col justify-start align-top sticky top-0">
                {!doiIdentifier && (
                  <p className="text-xs text-gray-500 m-2">{t('save_as_draft_helper')}</p>
                )}
                {showSaveAsDraft && (
                  <Button
                    variant="contained"
                    color="secondary"
                    size="small"
                    className="m-2 save-as-draft-button"
                    disabled={submittingAction !== null || !isTitleValid}
                    onClick={handleSaveDraft}
                  >
                    {draftButtonLabel}
                  </Button>
                )}
                {showSubmit && (
                  <Button
                    variant="contained"
                    color="primary"
                    disabled={!allSectionsCompleted || submittingAction !== null}
                    onClick={handleSubmitFinal}
                    size="small"
                    className="m-2 submit-button"
                  >
                    {submittingAction === 'submit' ? t('submitting') : t('submit')}
                  </Button>
                )}
                <Button
                  variant="outlined"
                  color="inherit"
                  size="small"
                  className="m-2 cancel-button"
                  onClick={handleCancel}
                >
                  {t('cancel')}
                </Button>
                <Button
                  variant="outlined"
                  color="secondary"
                  size="small"
                  className="m-2"
                  onClick={handleReset}
                >
                  {t('reset_form')}
                </Button>
              </div>
            </Grid>
          </Grid>
          {/* Metadata info panel — only shown in edit mode */}
          {raftData?.id && (
            <Paper
              variant="outlined"
              sx={{
                mt: 3,
                p: 2,
                bgcolor: 'grey.50',
                display: 'flex',
                flexWrap: 'wrap',
                gap: 2,
                alignItems: 'center',
              }}
            >
              {raftData.createdBy && (
                <Typography variant="caption" color="text.secondary">
                  Created by: <strong>{raftData.createdBy}</strong>
                </Typography>
              )}
              {raftData.version && (
                <Typography variant="caption" color="text.secondary">
                  Version: <strong>v{raftData.version}</strong>
                </Typography>
              )}
              {raftData.generalInfo?.status && (
                <Chip
                  label={raftData.generalInfo.status}
                  size="small"
                  sx={{ textTransform: 'capitalize', fontSize: '0.7rem' }}
                />
              )}
            </Paper>
          )}

          {/* Alert for notifications */}
          <Snackbar
            open={alert.open}
            autoHideDuration={6000}
            onClose={handleAlertClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          >
            <Alert onClose={handleAlertClose} severity={alert.severity} variant="filled">
              {alert.message}
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
      {/* Reset confirmation dialog */}
      <WarningDialog
        isOpen={resetWarningOpen}
        onCancel={() => setResetWarningOpen(false)}
        onOk={confirmReset}
        options={{
          title: t('modal_reset_title'),
          message: t('confirm_reset'),
          cancelCaption: t('cancel'),
          okCaption: t('reset_form'),
        }}
      />
    </div>
  )
}

export default FormLayoutWithContext
