'use server'

import { auth } from '@/auth/cadc-auth/credentials'
import { useMockData } from '@/config/environment'
import { updateMockRaftStatus } from '@/tests/mock-data-loader'

interface UpdateRaftStatusResponse {
  success: boolean
  message?: string
  error?: string
}

/**
 * Updates the status of a RAFT submission
 *
 * @param raftId - The ID of the RAFT to update
 * @param newStatus - The new status to set for the RAFT
 * @param comment - Optional comment about the status change
 * @returns Response object with success status and message
 */
export const updateRaftStatus = async (
  raftId: string,
  newStatus: string,
  comment?: string,
): Promise<UpdateRaftStatusResponse> => {
  try {
    // Use mock data if enabled
    if (useMockData) {
      const result = updateMockRaftStatus(raftId, newStatus)

      if (result.success) {
        return {
          success: true,
          message: `Status updated to ${newStatus} (mock)`,
        }
      } else {
        return {
          success: false,
          error: result.error || 'Failed to update status',
        }
      }
    }

    // Get the session with the access token
    const session = await auth()
    const accessToken = session?.accessToken

    if (!accessToken) {
      return {
        success: false,
        error: 'Not authenticated',
      }
    }

    // Prepare the request payload
    const payload = {
      status: newStatus,
      ...(comment && { comment }),
    }

    // Make the API call to update the RAFT status
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/rafts/${raftId}/status`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      },
    )

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error(`Failed to update RAFT status:`, errorData)

      return {
        success: false,
        error: errorData.message || `Request failed with status ${response.status}`,
      }
    }

    const data = await response.json()

    return {
      success: true,
      message: data.message || 'Status updated successfully',
    }
  } catch (error) {
    console.error('Error updating RAFT status:', error)

    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unknown error occurred',
    }
  }
}
