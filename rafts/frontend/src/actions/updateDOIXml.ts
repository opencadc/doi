'use server'

import { auth } from '@/auth/cadc-auth/credentials'
import { SUBMIT_DOI_URL, MESSAGE, SUCCESS } from '@/actions/constants'
import { IResponseData } from '@/actions/types'

/**
 * Fetches the XML for a specific DOI instance
 */
export const getDOIXml = async (doiSuffix: string): Promise<IResponseData<string>> => {
  try {
    const session = await auth()
    const accessToken = session?.accessToken

    if (!accessToken) {
      console.error('[getDOIXml] No access token available')
      return { [SUCCESS]: false, [MESSAGE]: 'Not authenticated' }
    }

    const url = `${SUBMIT_DOI_URL}/${doiSuffix}`
    console.log('[getDOIXml] Fetching from:', url)

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/xml',
        Cookie: `CADC_SSO=${accessToken}`,
      },
    })

    console.log('[getDOIXml] Response status:', response.status)

    if (!response.ok) {
      const errorText = await response.text().catch(() => '')
      console.error('[getDOIXml] Error response:', response.status, errorText)
      return {
        [SUCCESS]: false,
        [MESSAGE]: `Request failed with status ${response.status}: ${errorText}`,
      }
    }

    const xmlString = await response.text()
    console.log('[getDOIXml] Raw XML:', xmlString)

    return { [SUCCESS]: true, data: xmlString }
  } catch (error) {
    console.error('[getDOIXml] Exception:', error)
    return {
      [SUCCESS]: false,
      [MESSAGE]: error instanceof Error ? error.message : 'An unknown error occurred',
    }
  }
}

/**
 * Updates a DOI instance via POST with multipart form data
 * Backend expects: doiMetaData (DataCite JSON) and/or doiNodeData (node properties JSON)
 *
 * Updatable fields in doiMetaData: creators, titles, publicationYear, language
 * Updatable fields in doiNodeData: journalRef, status, reviewer
 */
export const updateDOIXml = async (
  doiSuffix: string,
  doiMetaData?: object,
  doiNodeData?: { journalRef?: string; status?: string; reviewer?: string },
): Promise<IResponseData<string>> => {
  try {
    const session = await auth()
    const accessToken = session?.accessToken

    if (!accessToken) {
      console.error('[updateDOIXml] No access token available')
      return { [SUCCESS]: false, [MESSAGE]: 'Not authenticated' }
    }

    const url = `${SUBMIT_DOI_URL}/${doiSuffix}`
    console.log('[updateDOIXml] POST to:', url)

    // Backend expects multipart form data
    const formData = new FormData()

    if (doiMetaData) {
      const metaDataBlob = new Blob([JSON.stringify(doiMetaData)], { type: 'application/json' })
      formData.append('doiMetaData', metaDataBlob)
      console.log('[updateDOIXml] doiMetaData:', JSON.stringify(doiMetaData, null, 2))
    }

    if (doiNodeData) {
      const nodeDataBlob = new Blob([JSON.stringify(doiNodeData)], { type: 'application/json' })
      formData.append('doiNodeData', nodeDataBlob)
      console.log('[updateDOIXml] doiNodeData:', JSON.stringify(doiNodeData, null, 2))
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Cookie: `CADC_SSO=${accessToken}`,
      },
      body: formData,
      redirect: 'manual', // Backend returns 303 on success
    })

    console.log('[updateDOIXml] Response status:', response.status)
    console.log('[updateDOIXml] Location header:', response.headers.get('Location'))

    // 303 redirect means success
    if (response.status === 303) {
      const location = response.headers.get('Location')
      console.log('[updateDOIXml] Success (303 redirect):', location)
      return { [SUCCESS]: true, data: location || 'Updated successfully' }
    }

    if (!response.ok) {
      const errorText = await response.text().catch(() => '')
      console.error('[updateDOIXml] Error response:', response.status, errorText)
      return {
        [SUCCESS]: false,
        [MESSAGE]: `Request failed with status ${response.status}: ${errorText}`,
      }
    }

    const responseText = await response.text()
    console.log('[updateDOIXml] Success response:', responseText)

    return { [SUCCESS]: true, data: responseText }
  } catch (error) {
    console.error('[updateDOIXml] Exception:', error)
    return {
      [SUCCESS]: false,
      [MESSAGE]: error instanceof Error ? error.message : 'An unknown error occurred',
    }
  }
}

// Note: modifyDataDirectoryInXml has been moved to @/utilities/xmlParser
// Import it from there: import { modifyDataDirectoryInXml } from '@/utilities/xmlParser'
