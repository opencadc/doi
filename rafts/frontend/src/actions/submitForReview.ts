'use server'

import { auth } from '@/auth/cadc-auth/credentials'
import { SUBMIT_DOI_URL, MESSAGE, SUCCESS } from '@/actions/constants'
import { IResponseData } from '@/actions/types'

import { BACKEND_STATUS } from '@/shared/backendStatus'

/**
 * Submits a RAFT for review by changing its status from 'in progress' to 'review ready'
 *
 * Per backend API: To update status, POST a plain JSON object like { status: "review ready" }
 * to /rafts/<DOI ID> (which is /doi/instances/<DOI ID>)
 *
 * The workflow is:
 * - Author submits: in progress → review ready
 * - Reviewer claims: review ready → in review (and assigns reviewer)
 *
 * @param doiId - The DOI identifier (e.g., 'RAFTS-0001')
 * @returns Response object with success status
 */
export const submitForReview = async (doiId: string): Promise<IResponseData<string>> => {
  try {
    // Get the session with the access token
    const session = await auth()
    const accessToken = session?.accessToken

    if (!accessToken) {
      console.error('[submitForReview] No access token available')
      return { [SUCCESS]: false, [MESSAGE]: 'Not authenticated' }
    }

    const url = `${SUBMIT_DOI_URL}/${doiId}`
    console.log('[submitForReview] Updating status to "review ready":', url)

    // Backend expects multipart form data with JSON blob labeled 'doiNodeData'
    // The JSON should contain { status: "review ready" }
    const formData = new FormData()
    const nodeData = JSON.stringify({ status: BACKEND_STATUS.REVIEW_READY })
    const jsonBlob = new Blob([nodeData], { type: 'application/json' })
    formData.append('doiNodeData', jsonBlob)

    console.log('[submitForReview] Sending doiNodeData:', nodeData)

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Cookie: `CADC_SSO=${accessToken}`,
      },
      body: formData,
    })

    console.log('[submitForReview] Response status:', response.status)

    if (!response.ok) {
      const errorText = await response.text().catch(() => '')
      console.error('[submitForReview] Error response:', response.status, errorText)
      return {
        [SUCCESS]: false,
        [MESSAGE]: `Failed to submit for review: ${response.status} ${errorText}`,
      }
    }

    const data = await response.text()
    console.log('[submitForReview] Success:', data)

    return {
      [SUCCESS]: true,
      data: 'RAFT submitted for review successfully',
    }
  } catch (error) {
    console.error('[submitForReview] Exception:', error)
    return {
      [SUCCESS]: false,
      [MESSAGE]: error instanceof Error ? error.message : 'An unknown error occurred',
    }
  }
}

/**
 * Reverts a RAFT from review back to draft status
 *
 * Per backend API: POST plain JSON { status: "in progress" } to /rafts/<DOI ID>
 *
 * @param doiId - The DOI identifier (e.g., 'RAFTS-0001')
 * @returns Response object with success status
 */
export const revertToDraft = async (doiId: string): Promise<IResponseData<string>> => {
  try {
    const session = await auth()
    const accessToken = session?.accessToken

    if (!accessToken) {
      console.error('[revertToDraft] No access token available')
      return { [SUCCESS]: false, [MESSAGE]: 'Not authenticated' }
    }

    const url = `${SUBMIT_DOI_URL}/${doiId}`
    console.log('[revertToDraft] Reverting status to "in progress":', url)

    // Backend expects multipart form data with JSON blob labeled 'doiNodeData'
    const formData = new FormData()
    const nodeData = JSON.stringify({ status: BACKEND_STATUS.IN_PROGRESS })
    const jsonBlob = new Blob([nodeData], { type: 'application/json' })
    formData.append('doiNodeData', jsonBlob)

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Cookie: `CADC_SSO=${accessToken}`,
      },
      body: formData,
    })

    console.log('[revertToDraft] Response status:', response.status)

    if (!response.ok) {
      const errorText = await response.text().catch(() => '')
      console.error('[revertToDraft] Error response:', response.status, errorText)
      return {
        [SUCCESS]: false,
        [MESSAGE]: `Failed to revert to draft: ${response.status} ${errorText}`,
      }
    }

    return {
      [SUCCESS]: true,
      data: 'RAFT reverted to draft successfully',
    }
  } catch (error) {
    console.error('[revertToDraft] Exception:', error)
    return {
      [SUCCESS]: false,
      [MESSAGE]: error instanceof Error ? error.message : 'An unknown error occurred',
    }
  }
}
