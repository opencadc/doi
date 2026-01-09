'use client'

import { useState, useCallback } from 'react'
import { validateADESFile } from '@/actions/adesValidation'
import type { ADESFileKind, ADESValidationResult } from '@/actions/adesValidation.types'

interface UseADESValidationReturn {
  isValidating: boolean
  validationResult: ADESValidationResult | null
  validationError: string | null
  validateFile: (
    file: File,
    kind: ADESFileKind,
  ) => Promise<{
    success: boolean
    result?: ADESValidationResult
  }>
  resetValidation: () => void
}

/**
 * Custom hook for ADES file validation
 *
 * @returns Object with validation state and functions
 */
export function useADESValidation(): UseADESValidationReturn {
  const [isValidating, setIsValidating] = useState(false)
  const [validationResult, setValidationResult] = useState<ADESValidationResult | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)

  /**
   * Reset validation state
   */
  const resetValidation = useCallback(() => {
    setValidationResult(null)
    setValidationError(null)
  }, [])

  /**
   * Validate an ADES file
   *
   * @param file - File to validate
   * @param kind - Type of ADES file (xml, psv, or mpc)
   * @returns Object with success status and validation result
   */
  const validateFile = useCallback(
    async (
      file: File,
      kind: ADESFileKind,
    ): Promise<{
      success: boolean
      result?: ADESValidationResult
    }> => {
      try {
        setIsValidating(true)
        resetValidation()

        // Create form data for the file
        const formData = new FormData()
        formData.append('file', file)

        // Call the server action
        const { success, result, error } = await validateADESFile(formData, kind)

        if (success && result) {
          setValidationResult(result)
          return { success: true, result }
        } else {
          setValidationError(error || 'Validation failed')
          return { success: false }
        }
      } catch (error) {
        console.error('Error in validateFile:', error)
        setValidationError(error instanceof Error ? error.message : 'An unexpected error occurred')
        return { success: false }
      } finally {
        setIsValidating(false)
      }
    },
    [resetValidation],
  )

  return {
    isValidating,
    validationResult,
    validationError,
    validateFile,
    resetValidation,
  }
}
