'use server'

import { auth } from '@/auth/cadc-auth/credentials'
import { SUBMIT_DOI_URL, MESSAGE, SUCCESS } from '@/actions/constants'
import { IResponseData } from '@/actions/types'
import { BACKEND_STATUS } from '@/shared/backendStatus'

/**
 * Assigns a reviewer to a RAFT/DOI.
 * Only publishers (members of RAFTS-test-reviewers group) can assign reviewers.
 *
 * The reviewer is stored as ivo://cadc.nrc.ca/vospace/doi#reviewer property.
 *
 * @param doiId - The DOI identifier suffix (e.g., "RAFTS-7rtut-gkryn.test")
 * @param reviewerUsername - The username of the reviewer to assign
 * @returns Response with success/error information
 */
export const assignReviewer = async (
  doiId: string,
  reviewerUsername: string,
): Promise<IResponseData<string>> => {
  try {
    const session = await auth()
    const accessToken = session?.accessToken

    if (!accessToken) {
      return { [SUCCESS]: false, [MESSAGE]: 'Not authenticated' }
    }

    const url = `${SUBMIT_DOI_URL}/${doiId}`
    console.log(`[assignReviewer] Assigning reviewer "${reviewerUsername}" to:`, url)

    // Backend expects multipart form data with JSON blob labeled 'doiNodeData'
    const formData = new FormData()
    const nodeData = JSON.stringify({ reviewer: reviewerUsername })
    const jsonBlob = new Blob([nodeData], { type: 'application/json' })
    formData.append('doiNodeData', jsonBlob)

    console.log('[assignReviewer] Sending doiNodeData:', nodeData)

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Cookie: `CADC_SSO=${accessToken}`,
      },
      body: formData,
      redirect: 'manual', // Backend returns 303 on success
    })

    console.log('[assignReviewer] Response status:', response.status)

    // 303 redirect means success
    if (response.status === 303) {
      console.log('[assignReviewer] Success (303 redirect)')
      return {
        [SUCCESS]: true,
        data: `Reviewer "${reviewerUsername}" assigned successfully`,
      }
    }

    if (!response.ok) {
      const errorText = await response.text().catch(() => '')
      console.error('[assignReviewer] Error response:', response.status, errorText)
      return {
        [SUCCESS]: false,
        [MESSAGE]: `Failed to assign reviewer: ${response.status} ${errorText}`,
      }
    }

    const responseText = await response.text()
    console.log('[assignReviewer] Success:', responseText)

    return {
      [SUCCESS]: true,
      data: `Reviewer "${reviewerUsername}" assigned successfully`,
    }
  } catch (error) {
    console.error('[assignReviewer] Exception:', error)
    return {
      [SUCCESS]: false,
      [MESSAGE]: error instanceof Error ? error.message : 'An unknown error occurred',
    }
  }
}

/**
 * Claims a RAFT for review by assigning the current user as the reviewer
 * AND changing the status to "in review" in a single API call.
 *
 * This does two things in one call:
 * 1. Assigns the reviewer
 * 2. Changes status from "review ready" → "in review"
 *
 * @param doiId - The DOI identifier suffix (e.g., "RAFTS-7rtut-gkryn.test")
 * @returns Response with success/error information
 */
export const claimForReview = async (doiId: string): Promise<IResponseData<string>> => {
  try {
    const session = await auth()
    const accessToken = session?.accessToken

    if (!accessToken) {
      return { [SUCCESS]: false, [MESSAGE]: 'Not authenticated' }
    }

    if (!session?.user?.name) {
      return { [SUCCESS]: false, [MESSAGE]: 'Username not available' }
    }

    const reviewerName = session.user.name
    const url = `${SUBMIT_DOI_URL}/${doiId}`
    console.log(`[claimForReview] User "${reviewerName}" claiming RAFT:`, url)

    // Backend supports setting both reviewer and status in one call
    const formData = new FormData()
    const nodeData = JSON.stringify({
      reviewer: reviewerName,
      status: BACKEND_STATUS.IN_REVIEW,
    })
    const jsonBlob = new Blob([nodeData], { type: 'application/json' })
    formData.append('doiNodeData', jsonBlob)

    console.log('[claimForReview] Sending doiNodeData:', nodeData)

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Cookie: `CADC_SSO=${accessToken}`,
      },
      body: formData,
      redirect: 'manual',
    })

    console.log('[claimForReview] Response status:', response.status)

    if (response.status === 303 || response.ok) {
      return {
        [SUCCESS]: true,
        data: `RAFT claimed for review by "${reviewerName}"`,
      }
    }

    const errorText = await response.text().catch(() => '')
    console.error('[claimForReview] Error response:', response.status, errorText)
    return {
      [SUCCESS]: false,
      [MESSAGE]: `Failed to claim for review: ${response.status} ${errorText}`,
    }
  } catch (error) {
    console.error('[claimForReview] Exception:', error)
    return {
      [SUCCESS]: false,
      [MESSAGE]: error instanceof Error ? error.message : 'An unknown error occurred',
    }
  }
}

/**
 * Releases a review by unassigning the reviewer AND changing status back to "review ready".
 * Only publishers can release reviews.
 *
 * This does two things in one call:
 * 1. Removes the reviewer assignment
 * 2. Changes status from "in review" → "review ready"
 *
 * @param doiId - The DOI identifier suffix (e.g., "RAFTS-7rtut-gkryn.test")
 * @returns Response with success/error information
 */
export const releaseReview = async (doiId: string): Promise<IResponseData<string>> => {
  try {
    const session = await auth()
    const accessToken = session?.accessToken

    if (!accessToken) {
      return { [SUCCESS]: false, [MESSAGE]: 'Not authenticated' }
    }

    const url = `${SUBMIT_DOI_URL}/${doiId}`
    console.log('[releaseReview] Releasing review for:', url)

    // Send empty reviewer and status back to review ready
    const formData = new FormData()
    const nodeData = JSON.stringify({
      reviewer: '',
      status: BACKEND_STATUS.REVIEW_READY,
    })
    const jsonBlob = new Blob([nodeData], { type: 'application/json' })
    formData.append('doiNodeData', jsonBlob)

    console.log('[releaseReview] Sending doiNodeData:', nodeData)

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Cookie: `CADC_SSO=${accessToken}`,
      },
      body: formData,
      redirect: 'manual',
    })

    console.log('[releaseReview] Response status:', response.status)

    if (response.status === 303 || response.ok) {
      return { [SUCCESS]: true, data: 'Review released successfully' }
    }

    const errorText = await response.text().catch(() => '')
    return {
      [SUCCESS]: false,
      [MESSAGE]: `Failed to release review: ${response.status} ${errorText}`,
    }
  } catch (error) {
    console.error('[releaseReview] Exception:', error)
    return {
      [SUCCESS]: false,
      [MESSAGE]: error instanceof Error ? error.message : 'An unknown error occurred',
    }
  }
}

/**
 * Unassigns the reviewer from a RAFT/DOI (without changing status).
 * Only publishers can unassign reviewers.
 *
 * @param doiId - The DOI identifier suffix (e.g., "RAFTS-7rtut-gkryn.test")
 * @returns Response with success/error information
 */
export const unassignReviewer = async (doiId: string): Promise<IResponseData<string>> => {
  try {
    const session = await auth()
    const accessToken = session?.accessToken

    if (!accessToken) {
      return { [SUCCESS]: false, [MESSAGE]: 'Not authenticated' }
    }

    const url = `${SUBMIT_DOI_URL}/${doiId}`
    console.log('[unassignReviewer] Removing reviewer from:', url)

    // Send empty reviewer to unassign
    const formData = new FormData()
    const nodeData = JSON.stringify({ reviewer: '' })
    const jsonBlob = new Blob([nodeData], { type: 'application/json' })
    formData.append('doiNodeData', jsonBlob)

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Cookie: `CADC_SSO=${accessToken}`,
      },
      body: formData,
      redirect: 'manual',
    })

    console.log('[unassignReviewer] Response status:', response.status)

    if (response.status === 303 || response.ok) {
      return { [SUCCESS]: true, data: 'Reviewer unassigned successfully' }
    }

    const errorText = await response.text().catch(() => '')
    return {
      [SUCCESS]: false,
      [MESSAGE]: `Failed to unassign reviewer: ${response.status} ${errorText}`,
    }
  } catch (error) {
    console.error('[unassignReviewer] Exception:', error)
    return {
      [SUCCESS]: false,
      [MESSAGE]: error instanceof Error ? error.message : 'An unknown error occurred',
    }
  }
}
