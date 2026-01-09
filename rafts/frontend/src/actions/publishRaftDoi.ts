'use server'

import { auth } from '@/auth/cadc-auth/credentials'
import { SUBMIT_DOI_URL } from '@/actions/constants'

interface PublishDOIResponse {
  success: boolean
  message?: string
  error?: string
}

/**
 * Mints/Publishes a DOI for a RAFT submission via the DOI backend.
 * Calls the dedicated /mint endpoint to trigger the minting workflow.
 *
 * Endpoint: POST /rafts/instances/{raftId}/mint
 *
 * @param raftId - The DOI identifier suffix (e.g., "RAFTS-7rtut-gkryn.test")
 * @returns Response object with success status and message
 */
export const publishRAFTDOI = async (raftId: string): Promise<PublishDOIResponse> => {
  try {
    const session = await auth()
    const accessToken = session?.accessToken

    if (!accessToken) {
      return {
        success: false,
        error: 'Not authenticated',
      }
    }

    const url = `${SUBMIT_DOI_URL}/${raftId}/mint`
    console.log('[publishRAFTDOI] Minting DOI:', url)

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Cookie: `CADC_SSO=${accessToken}`,
      },
    })

    const responseText = await response.text()
    console.log('[publishRAFTDOI] Response status:', response.status, responseText)

    if (!response.ok) {
      return {
        success: false,
        error: `Failed to mint DOI: ${response.status} ${responseText}`,
      }
    }

    return {
      success: true,
      message: 'DOI minted and published successfully',
    }
  } catch (error) {
    console.error('[publishRAFTDOI] Error:', error)

    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unknown error occurred',
    }
  }
}
