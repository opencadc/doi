'use server'

import { auth } from '@/auth/cadc-auth/credentials'
import convertToDataCite from '@/utilities/jsonToDataCite'
import { SUBMIT_DOI_URL, SUCCESS, MESSAGE } from '@/actions/constants'
import { extractDOI } from '@/utilities/doiIdentifier'
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

export const submitDOI = async (formData: TRaftContext): Promise<IResponseData<string>> => {
  const convertedJSON = convertToDataCite(formData)
  try {
    // Get the session with the access token
    const session = await auth()
    const accessToken = session?.accessToken

    if (!accessToken) {
      console.error('[submitDOI] No access token available')
      return { [SUCCESS]: false, [MESSAGE]: 'Not authenticated' }
    }

    // DOI backend expects multipart form data with:
    // - 'doiMetaData' for DataCite metadata
    // - 'doiNodeData' for status updates
    const multipartFormData = new FormData()
    const jsonBlob = new Blob([JSON.stringify(convertedJSON)], { type: 'application/json' })
    multipartFormData.append('doiMetaData', jsonBlob)

    // Include status if provided
    if (formData.generalInfo?.status) {
      const backendStatus = getBackendStatus(formData.generalInfo.status)
      const nodeData = JSON.stringify({ status: backendStatus })
      const nodeBlob = new Blob([nodeData], { type: 'application/json' })
      multipartFormData.append('doiNodeData', nodeBlob)
      console.log('[submitDOI] Including status:', backendStatus)
    }

    console.log('[submitDOI] Submitting to:', SUBMIT_DOI_URL)
    console.log('[submitDOI] Payload:', JSON.stringify(convertedJSON, null, 2))

    // Make the API call with the access token as a cookie (DOI expects cookie auth)
    // DOI backend returns 303 redirect on success - don't auto-follow
    const response = await fetch(SUBMIT_DOI_URL, {
      method: 'POST',
      headers: {
        // Don't set Content-Type for FormData - browser will set it with boundary
        Cookie: `CADC_SSO=${accessToken}`,
      },
      body: multipartFormData,
      redirect: 'manual', // Don't follow redirects - 303 means success
    })

    console.log('[submitDOI] Response status:', response.status)
    console.log('[submitDOI] Location header:', response.headers.get('Location'))

    // 303 redirect means success - the Location header contains the new DOI URL
    if (response.status === 303) {
      const location = response.headers.get('Location')
      console.log('[submitDOI] Success (303 redirect):', location)
      if (location) {
        const identifier = location.split('/').pop()
        console.log('[submitDOI] Extracted identifier from redirect:', identifier)
        if (identifier) {
          await uploadFile(identifier, formData, accessToken)
        }
        return { [SUCCESS]: true, data: location }
      }
    }

    if (!response.ok) {
      const errorText = await response.text().catch(() => '')
      console.error('[submitDOI] Error response:', response.status, errorText)
      return {
        [SUCCESS]: false,
        [MESSAGE]: `Request failed with status ${response.status}: ${errorText}`,
      }
    }

    const data = await response.text()
    console.log('[submitDOI] Success response:', data)
    if (data) {
      const identifier = extractDOI(data)?.split('/')?.[1]
      console.log('[submitDOI] Extracted identifier:', identifier)
      if (identifier) {
        await uploadFile(identifier, formData, accessToken)
      }
    }
    return { [SUCCESS]: true, data }
  } catch (error) {
    console.error('[submitDOI] Exception:', error)
    return {
      [SUCCESS]: false,
      [MESSAGE]: error instanceof Error ? error.message : 'An unknown error occurred',
    }
  }
}
