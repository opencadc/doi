'use client'

import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react'
import { clearRaftData, loadRaftData, saveRaftData } from '@/utilities/localStorage'
import {
  OPTION_DRAFT,
  OPTION_REVIEW,
  PROP_AUTHOR_INFO,
  PROP_GENERAL_INFO,
  PROP_MISC_INFO,
  PROP_OBSERVATION_INFO,
  PROP_TECHNICAL_INFO,
  PROP_STATUS,
} from '@/shared/constants'
import { TRaftStatus, TRaftSubmission, TSection } from '@/shared/model'
import { VALIDATION_SCHEMAS } from '@/context/constants'
import { validateWithSchema, getValidationErrors } from '@/utilities/validation'
import { TRaftContext } from '@/context/types'
import { submitDOI } from '@/actions/submitDOI'
import { updateDOI } from '@/actions/updateDOI'
import { IResponseData } from '@/actions/types'

// Define a type that recursively converts all leaf values to string
type RecursiveStringify<T> = T extends object
  ? { [K in keyof T]?: RecursiveStringify<T[K]> }
  : string

// Initial empty state structure
const initialRaftState: TRaftContext | null = null

// Define context type
interface RaftFormContextType {
  raftData: TRaftContext | null
  isLoading: boolean
  updateRaftSection: (section: string, data: TSection) => void
  resetForm: () => void
  setFormFromFile: (data: TRaftContext) => void
  submitForm: (isDraft: boolean) => Promise<IResponseData<string>>
  isSubmitting: boolean
  isSectionCompleted: (section: keyof typeof VALIDATION_SCHEMAS) => boolean
  allSectionsCompleted: boolean
  errors: RecursiveStringify<TRaftSubmission>
  setRaftErrors: (section: keyof typeof VALIDATION_SCHEMAS) => void
  /** DOI identifier for attachment uploads (available after first save) */
  doiIdentifier: string | null
}

// Create context
const RaftFormContext = createContext<RaftFormContextType | undefined>(undefined)

interface RaftFormProviderProps {
  children: ReactNode
  initialRaftData?: TRaftContext | null
  useLocalStorage?: boolean
}

// Provider component
export function RaftFormProvider({
  children,
  initialRaftData = null,
  useLocalStorage = true,
}: RaftFormProviderProps) {
  const [raftData, setRaftData] = useState<TRaftContext | null>(initialRaftData || initialRaftState)
  const [isLoading, setIsLoading] = useState(initialRaftData === null && useLocalStorage)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<RecursiveStringify<TRaftSubmission>>({})
  // DOI identifier for attachment uploads - derived from raftData.id or set after first save
  const [doiIdentifier, setDoiIdentifier] = useState<string | null>(initialRaftData?.id || null)

  // Load saved data on initial render if no initialRaftData was provided
  useEffect(() => {
    const loadData = async () => {
      if (initialRaftData) {
        // If initialRaftData is provided, use it directly
        setRaftData(initialRaftData)
        // Sync doiIdentifier with the id from initial data
        if (initialRaftData.id) {
          setDoiIdentifier(initialRaftData.id)
        }
        setIsLoading(false)
      } else if (useLocalStorage) {
        // Otherwise try to load from localStorage if enabled
        const savedData = loadRaftData()
        if (savedData) {
          setRaftData(savedData)
          // Sync doiIdentifier with saved data
          if (savedData.id) {
            setDoiIdentifier(savedData.id)
          }
        }
        setIsLoading(false)
      } else {
        // Neither initialRaftData nor localStorage - just start with empty state
        setIsLoading(false)
      }
    }

    loadData()
  }, [initialRaftData, useLocalStorage])

  // Update a section of the form
  const updateRaftSection = useCallback(
    (section: string, data: TSection) => {
      setRaftData((prevState) => {
        const newState: TRaftContext = {
          ...(prevState ? prevState : {}),
          [section]: data,
        }

        // Save to localStorage after state update if enabled
        if (useLocalStorage) {
          saveRaftData(newState)
        }

        return newState
      })
    },
    [useLocalStorage],
  )

  // Reset the entire form
  const resetForm = useCallback(() => {
    if (useLocalStorage) {
      clearRaftData()
    }
    setRaftData(initialRaftData || initialRaftState)
  }, [initialRaftData, useLocalStorage])

  // Set form from file
  const setFormFromFile = useCallback((formData: TRaftContext) => {
    if (formData) {
      setRaftData(formData)
    }
  }, [])

  // Submit the form
  const submitForm = useCallback(
    async (isDraft: boolean) => {
      try {
        setIsSubmitting(true)

        // Determine the status to set
        const newStatus = (isDraft ? OPTION_DRAFT : OPTION_REVIEW) as TRaftStatus

        // Create final submission object with status in generalInfo
        const finalSubmission: TRaftContext = {
          ...raftData,
          [PROP_GENERAL_INFO]: {
            ...(raftData?.[PROP_GENERAL_INFO] || {}),
            [PROP_STATUS]: newStatus,
          } as TRaftContext[typeof PROP_GENERAL_INFO],
        }

        let result

        if (finalSubmission?.id) {
          result = await updateDOI(finalSubmission, finalSubmission?.id)
        } else {
          result = await submitDOI(finalSubmission)
        }

        // After successful submit, extract and store DOI identifier
        if (result?.success && result.data) {
          // For new submissions, result.data is the DOI URL (e.g., https://...doi/instances/25.0047)
          // Extract the identifier from the URL
          const identifier = typeof result.data === 'string' ? result.data.split('/').pop() : null

          if (identifier && !finalSubmission?.id) {
            // Update the doiIdentifier state
            setDoiIdentifier(identifier)

            // Update raftData to include the id for future saves
            setRaftData((prev) => (prev ? { ...prev, id: identifier } : prev))

            console.log('[submitForm] DOI created:', identifier)
          }
        }

        // Clear draft after successful submission if using localStorage
        if (result?.success && useLocalStorage) {
          clearRaftData()
        }

        return result
      } catch (error) {
        console.error('Error submitting RAFT:', error)
        throw error
      } finally {
        setIsSubmitting(false)
      }
    },
    [raftData, useLocalStorage],
  )

  // Check if a section is completed
  const isSectionCompleted = useCallback(
    (section: keyof typeof VALIDATION_SCHEMAS) => {
      return raftData?.[section]
        ? validateWithSchema(VALIDATION_SCHEMAS[section], raftData?.[section])
        : false
    },
    [raftData],
  )

  // Set errors for a specific section
  const setRaftErrors = useCallback(
    (section: keyof typeof VALIDATION_SCHEMAS) => {
      setErrors((prevErrors) => ({
        ...prevErrors,
        [section]: raftData?.[section]
          ? getValidationErrors(VALIDATION_SCHEMAS[section], raftData?.[section])
          : undefined,
      }))
    },
    [raftData],
  )

  // Check if all sections are completed
  const allSectionsCompleted = [
    PROP_GENERAL_INFO,
    PROP_AUTHOR_INFO,
    PROP_OBSERVATION_INFO,
    PROP_TECHNICAL_INFO,
    PROP_MISC_INFO,
  ].every((section) => isSectionCompleted(section as keyof typeof VALIDATION_SCHEMAS))

  // Create context value
  const contextValue: RaftFormContextType = {
    raftData,
    isLoading,
    updateRaftSection,
    resetForm,
    setFormFromFile,
    submitForm,
    isSubmitting,
    isSectionCompleted,
    allSectionsCompleted,
    errors,
    setRaftErrors,
    doiIdentifier,
  }

  return <RaftFormContext.Provider value={contextValue}>{children}</RaftFormContext.Provider>
}

// Custom hook to use the context
export function useRaftForm() {
  const context = useContext(RaftFormContext)
  if (context === undefined) {
    throw new Error('useRaftForm must be used within a RaftFormProvider')
  }
  return context
}
