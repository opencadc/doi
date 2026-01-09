'use server'

import { auth } from '@/auth/cadc-auth/credentials'
import { TRaftSubmission } from '@/shared/model'

export interface SubmitRaftOptions {
  generateForumPost?: boolean
  relatedRafts?: string[]
}

/**
 * Server action to submit a new RAFT to the backend API
 *
 * @param {SubmitRaftOptions} options - Additional options for RAFT submission
 * @param {TRaftSubmission} raftData - The RAFT data to submit
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 */
export const submitRaft = async (raftData: TRaftSubmission, options: SubmitRaftOptions = {}) => {
  try {
    // Get the session with the access token
    const session = await auth()
    const accessToken = session?.accessToken

    if (!accessToken) {
      return { success: false, error: 'Not authenticated' }
    }

    // Prepare the payload for submission
    const payload = {
      ...raftData,
      generateForumPost: options.generateForumPost ?? true, // Default to true
      relatedRafts: options.relatedRafts ?? [],
    }
    // Make the API call with the access token as a Bearer token
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/rafts/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'RAFT-System/1.0',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('Failed to submit RAFT:', errorData)
      return {
        success: false,
        error: errorData.message || `Request failed with status ${response.status}`,
      }
    }

    const responseData = await response.json()
    return { success: true, data: responseData.data }
  } catch (error) {
    console.error('Error submitting RAFT:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unknown error occurred',
    }
  }
}
