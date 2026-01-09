'use server'

import { auth } from '@/auth/cadc-auth/credentials'
import { RaftData } from '@/types/doi'

export interface UpdateRaftOptions {
  generateForumPost?: boolean
  relatedRafts?: string[]
}

/**
 * Server action to update an existing RAFT in the backend API
 *
 * @param {string} raftId - The ID of the RAFT to update
 * @param {TRaftSubmission} raftData - The updated RAFT data
 * @param {UpdateRaftOptions} options - Additional options for RAFT update
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 */
export const updateRaft = async (
  raftId: string,
  raftData: RaftData,
  options: UpdateRaftOptions = {},
) => {
  try {
    // Get the session with the access token
    const session = await auth()
    const accessToken = session?.accessToken

    if (!accessToken) {
      return { success: false, error: 'Not authenticated' }
    }

    if (!raftId) {
      return { success: false, error: 'RAFT ID is required for updates' }
    }

    // Prepare the payload for submission
    const payload = {
      ...raftData,
      generateForumPost: options.generateForumPost ?? false, // Default to false for updates
      relatedRafts: options.relatedRafts ?? [],
    }

    // Make the API call with the access token as a Bearer token
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/rafts/${raftId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'RAFT-System/1.0',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error(`Failed to update RAFT ${raftId}:`, errorData)
      return {
        success: false,
        error: errorData.message || `Request failed with status ${response.status}`,
      }
    }

    const responseData = await response.json()
    return { success: true, data: responseData.data }
  } catch (error) {
    console.error('Error updating RAFT:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unknown error occurred',
    }
  }
}
