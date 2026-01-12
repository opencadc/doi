'use server'

import { auth } from '@/auth/cadc-auth/credentials'
import { SUBMIT_DOI_URL } from '@/actions/constants'

/**
 * Server action to delete a RAFT/DOI from the backend
 *
 * The DOI service expects:
 * - DELETE /doi/instances/{doiSuffix}
 * - Cookie-based authentication with CADC_SSO
 *
 * @param {string} doiSuffix - The DOI suffix to delete (e.g., "24.0001")
 * @returns {Promise<{success: boolean, message?: string}>}
 */
export const deleteRaft = async (doiSuffix: string) => {
  try {
    // Get the session with the access token
    const session = await auth()
    const accessToken = session?.accessToken

    if (!accessToken) {
      return { success: false, message: 'Not authenticated' }
    }

    if (!doiSuffix) {
      return { success: false, message: 'DOI suffix is required for deletion' }
    }

    console.log('[deleteRaft] Deleting DOI:', doiSuffix)
    console.log('[deleteRaft] URL:', `${SUBMIT_DOI_URL}/${doiSuffix}`)

    // Make the DELETE API call with cookie-based auth (DOI service expects CADC_SSO cookie)
    const response = await fetch(`${SUBMIT_DOI_URL}/${doiSuffix}`, {
      method: 'DELETE',
      headers: {
        Cookie: `CADC_SSO=${accessToken}`,
      },
    })

    console.log('[deleteRaft] Response status:', response.status)

    if (!response.ok) {
      const errorText = await response.text().catch(() => '')
      console.error('[deleteRaft] Error response:', response.status, errorText)

      // Parse error message from response if available
      let errorMessage = `Request failed with status ${response.status}`
      if (errorText) {
        errorMessage = errorText
      }
      if (response.status === 401) {
        errorMessage = 'Not authorized to delete this resource'
      }
      if (response.status === 403) {
        errorMessage = 'Access denied - you may not have permission to delete this DOI'
      }
      if (response.status === 404) {
        errorMessage = 'DOI not found'
      }

      return {
        success: false,
        message: errorMessage,
      }
    }

    console.log('[deleteRaft] Successfully deleted DOI:', doiSuffix)
    return { success: true, message: 'RAFT deleted successfully' }
  } catch (error) {
    console.error('[deleteRaft] Exception:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : 'An unknown error occurred',
    }
  }
}
