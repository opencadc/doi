'use server'

import { auth } from '@/auth/cadc-auth/credentials'
import { SUBMIT_DOI_URL } from '@/actions/constants'
import { IResponseData } from '@/actions/types'
import { BackendStatusType } from '@/shared/backendStatus'

/**
 * Updates the status of a RAFT/DOI via the DOI backend service.
 *
 * Status workflow:
 * - in progress → in review (submit for review)
 * - in review → approved (approve)
 * - in review → rejected (reject)
 * - in review → in progress (send back for revision)
 * - rejected → in progress (revise and resubmit)
 * - approved → minted (minting workflow)
 *
 * @param doiId - The DOI identifier suffix (e.g., "RAFTS-7rtut-gkryn.test")
 * @param newStatus - The new backend status value
 * @returns Response with success/error information
 */
export const updateDOIStatus = async (
  doiId: string,
  newStatus: BackendStatusType,
): Promise<IResponseData<string>> => {
  try {
    const session = await auth()
    const accessToken = session?.accessToken

    if (!accessToken) {
      return { success: false, message: 'Not authenticated' }
    }

    const url = `${SUBMIT_DOI_URL}/${doiId}`
    console.log(`[updateDOIStatus] Updating status to "${newStatus}":`, url)

    // Backend expects multipart form data with JSON blob labeled 'doiNodeData'
    const formData = new FormData()
    const nodeData = JSON.stringify({ status: newStatus })
    const jsonBlob = new Blob([nodeData], { type: 'application/json' })
    formData.append('doiNodeData', jsonBlob)

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Cookie: `CADC_SSO=${accessToken}`,
      },
      body: formData,
    })

    const responseText = await response.text()
    console.log('[updateDOIStatus] Response status:', response.status, responseText)

    if (!response.ok) {
      return {
        success: false,
        message: `Failed to update status: ${response.status} ${responseText}`,
      }
    }

    return {
      success: true,
      message: `Status updated to "${newStatus}" successfully`,
      data: responseText,
    }
  } catch (error) {
    console.error('[updateDOIStatus] Error:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : 'An unknown error occurred',
    }
  }
}
