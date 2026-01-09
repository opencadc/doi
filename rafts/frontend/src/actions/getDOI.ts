'use server'

import { auth } from '@/auth/cadc-auth/credentials'
import { SUBMIT_DOI_URL } from '@/actions/constants'
import { parseXmlToJson } from '@/utilities/xmlParser'
import { sortByIdentifierNumber } from '@/utilities/doiIdentifier'
import { DOIData } from '@/types/doi'

export const getDOIData = async () => {
  try {
    // Get the session with the access token
    const session = await auth()
    const accessToken = session?.accessToken

    if (!accessToken) {
      console.error('[getDOIData] No access token available')
      return { success: false, error: 'Not authenticated' }
    }

    console.log('[getDOIData] Fetching from:', SUBMIT_DOI_URL)

    // Make the API call with the access token as a cookie (DOI expects cookie auth)
    const response = await fetch(`${SUBMIT_DOI_URL}`, {
      method: 'GET',
      headers: {
        Accept: 'application/xml',
        Cookie: `CADC_SSO=${accessToken}`,
      },
    })

    console.log('[getDOIData] Response status:', response.status)

    if (!response.ok) {
      const errorText = await response.text().catch(() => '')
      console.error('[getDOIData] Error response:', response.status, errorText)
      if (response.status === 401) {
        return {
          success: false,
          data: [],
          error: `${response.status}`,
        }
      }

      return {
        success: false,
        data: [],
        error: `Request failed with status ${response.status}`,
      }
    }

    const xmlString = await response.text()
    console.log('[getDOIData] XML response length:', xmlString.length)
    console.log('[getDOIData] Raw XML:', xmlString)
    const data: DOIData[] = await parseXmlToJson(xmlString)
    console.log('[getDOIData] Parsed DOIs count:', data.length)
    console.log('[getDOIData] Parsed DOIs:', JSON.stringify(data, null, 2))

    return { success: true, data: sortByIdentifierNumber(data) }
  } catch (error) {
    console.error('[getDOIData] Exception:', error)
    return {
      success: false,
      data: [],
      error: error instanceof Error ? error.message : 'An unknown error occurred',
    }
  }
}
