'use server'

import { auth } from '@/auth/cadc-auth/credentials'
import convertToDataCite from '@/utilities/jsonToDataCite'
import { SUBMIT_DOI_URL, MESSAGE, SUCCESS } from '@/actions/constants'
import { uploadFile } from '@/services/canfarStorage'
import { TRaftContext } from '@/context/types'
import { IResponseData } from '@/actions/types'
import { OPTION_REVIEW, OPTION_DRAFT } from '@/shared/constants'
import { BACKEND_STATUS } from '@/shared/backendStatus'

// Map frontend status to backend status
// When author submits for review, status becomes "review ready" (not "in review")
// "in review" is set when a publisher claims the RAFT for review
const getBackendStatus = (frontendStatus?: string): string => {
  switch (frontendStatus) {
    case OPTION_REVIEW:
      return BACKEND_STATUS.REVIEW_READY
    case OPTION_DRAFT:
      return BACKEND_STATUS.IN_PROGRESS
    default:
      return BACKEND_STATUS.IN_PROGRESS
  }
}

export const updateDOI = async (
  formData: TRaftContext,
  id: string,
): Promise<IResponseData<string>> => {
  const convertedJSON = convertToDataCite(formData)
  try {
    // Get the session with the access token
    const session = await auth()
    const accessToken = session?.accessToken

    if (!accessToken) {
      console.error('[updateDOI] No access token available')
      return { [SUCCESS]: false, [MESSAGE]: 'Not authenticated' }
    }

    // DOI backend expects multipart form data with:
    // - 'doiMetaData' for DataCite metadata
    // - 'doiNodeData' for status updates
    const multipartFormData = new FormData()
    const jsonBlob = new Blob([JSON.stringify(convertedJSON)], { type: 'application/json' })
    multipartFormData.append('doiMetaData', jsonBlob)

    // Include status update if status is provided
    if (formData.generalInfo?.status) {
      const backendStatus = getBackendStatus(formData.generalInfo.status)
      const nodeData = JSON.stringify({ status: backendStatus })
      const nodeBlob = new Blob([nodeData], { type: 'application/json' })
      multipartFormData.append('doiNodeData', nodeBlob)
      console.log('[updateDOI] Including status update:', backendStatus)
    }

    const url = `${SUBMIT_DOI_URL}/${id}`
    console.log('[updateDOI] Updating:', url)
    console.log('[updateDOI] Payload:', JSON.stringify(convertedJSON, null, 2))

    // Make the API call with the access token as a cookie (DOI expects cookie auth)
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        // Don't set Content-Type for FormData - browser will set it with boundary
        Cookie: `CADC_SSO=${accessToken}`,
      },
      body: multipartFormData,
    })

    console.log('[updateDOI] Response status:', response.status)
    if (!response.ok) {
      const errorText = await response.text().catch(() => '')
      console.error('[updateDOI] Error response:', response.status, errorText)
      return {
        [SUCCESS]: false,
        [MESSAGE]: `Request failed with status ${response.status}: ${errorText}`,
      }
    }

    const data = await response.text()
    console.log('[updateDOI] Success response:', data)

    // Try to upload RAFT.json, but don't fail if it doesn't work
    // The DOI XML is the primary data store, RAFT.json is for faster form loading
    if (id) {
      try {
        const uploadResult = await uploadFile(id, formData, accessToken)
        if (uploadResult.error) {
          console.warn(
            '[updateDOI] RAFT.json upload failed (non-critical):',
            uploadResult.error.message,
          )
        }
      } catch (uploadError) {
        console.warn('[updateDOI] RAFT.json upload exception (non-critical):', uploadError)
      }
    }

    return { [SUCCESS]: true, data }
  } catch (error) {
    console.error('[updateDOI] Exception:', error)
    return {
      [SUCCESS]: false,
      [MESSAGE]: error instanceof Error ? error.message : 'An unknown error occurred',
    }
  }
}
