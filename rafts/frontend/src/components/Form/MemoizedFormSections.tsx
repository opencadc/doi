import React from 'react'
import AuthorForm from '@/components/Form/AuthorForm'
import AnnouncementForm from '@/components/Form/AnnouncementForm'
import ObservationInfoForm from '@/components/Form/ObservationInfoForm'
import MiscellaneousInfoForm from '@/components/Form/MiscellaneousInfoForm'

// Memoized AuthorForm
export const MemoizedAuthorForm = React.memo(AuthorForm, (prevProps, nextProps) => {
  return (
    JSON.stringify(prevProps.initialData) === JSON.stringify(nextProps.initialData) &&
    prevProps.onSubmitAuthor === nextProps.onSubmitAuthor &&
    prevProps.formIsDirty === nextProps.formIsDirty
  )
})
MemoizedAuthorForm.displayName = 'MemoizedAuthorForm'

// Memoized AnnouncementForm
export const MemoizedAnnouncementForm = React.memo(AnnouncementForm, (prevProps, nextProps) => {
  return (
    JSON.stringify(prevProps.initialData) === JSON.stringify(nextProps.initialData) &&
    prevProps.onSubmitObservation === nextProps.onSubmitObservation &&
    prevProps.formIsDirty === nextProps.formIsDirty
  )
})
MemoizedAnnouncementForm.displayName = 'MemoizedAnnouncementForm'

// Memoized ObservationInfoForm
export const MemoizedObservationInfoForm = React.memo(
  ObservationInfoForm,
  (prevProps, nextProps) => {
    return (
      JSON.stringify(prevProps.initialData) === JSON.stringify(nextProps.initialData) &&
      prevProps.onSubmitTechnical === nextProps.onSubmitTechnical &&
      prevProps.formIsDirty === nextProps.formIsDirty
    )
  },
)
MemoizedObservationInfoForm.displayName = 'MemoizedObservationInfoForm'

// Memoized MiscellaneousInfoForm
export const MemoizedMiscellaneousInfoForm = React.memo(
  MiscellaneousInfoForm,
  (prevProps, nextProps) => {
    return (
      JSON.stringify(prevProps.initialData) === JSON.stringify(nextProps.initialData) &&
      prevProps.onSubmitMiscellaneous === nextProps.onSubmitMiscellaneous &&
      prevProps.formIsDirty === nextProps.formIsDirty
    )
  },
)
MemoizedMiscellaneousInfoForm.displayName = 'MemoizedMiscellaneousInfoForm'
