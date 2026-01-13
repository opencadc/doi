'use server'

import type { ADESFileKind, ADESValidationResult } from './adesValidation.types'

// Use environment variables with fallbacks for different validator endpoints
// Server actions use runtime env vars (no NEXT_PUBLIC_ prefix needed)
// Check both prefixed and non-prefixed for compatibility
const VALIDATOR_URLS: Record<ADESFileKind, string> = {
  xml:
    process.env.VALIDATOR_URL_XML ||
    process.env.NEXT_PUBLIC_VALIDATOR_URL_XML ||
    'http://localhost:8000/validate-xml',
  psv:
    process.env.VALIDATOR_URL_PSV ||
    process.env.NEXT_PUBLIC_VALIDATOR_URL_PSV ||
    'http://localhost:8000/validate-psv',
  mpc:
    process.env.VALIDATOR_URL_MPC ||
    process.env.NEXT_PUBLIC_VALIDATOR_URL_MPC ||
    'http://localhost:8000/validate-mpc',
}

/**
 * Validates ADES format files against an internal validator
 *
 * @param formData - FormData containing the file to validate
 * @param kind - Type of ADES file (xml, psv, or mpc)
 * @returns Object containing success status and either result or error message
 */
export const validateADESFile = async (
  formData: FormData,
  kind: ADESFileKind,
): Promise<{ success: boolean; result?: ADESValidationResult; error?: string }> => {
  try {
    const validatorURL = VALIDATOR_URLS[kind]
    if (!validatorURL) {
      return { success: false, error: `Invalid file kind: ${kind}` }
    }
    // Make the API call to the internal validator service
    const backendRes = await fetch(validatorURL, {
      method: 'POST',
      body: formData,
    })

    if (!backendRes.ok) {
      const errorData = await backendRes.json().catch(() => ({}))
      console.error('Validation error:', errorData)
      return {
        success: false,
        error: errorData.message || `Request failed with status ${backendRes.status}`,
      }
    }

    const result: ADESValidationResult = await backendRes.json()
    return { success: true, result }
  } catch (error) {
    console.error('Error validating ADES file:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unknown error occurred',
    }
  }
}
