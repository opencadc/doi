'use server'

import { auth } from '@/auth/cadc-auth/credentials'
import { RaftData } from '@/types/doi'
import { useMockData } from '@/config/environment'
import { getMockRaftById } from '@/tests/mock-data-loader'

export const getInternalRaftById = async (id: string) => {
  try {
    // Use mock data if enabled
    if (useMockData) {
      const mockRaft = getMockRaftById(id)

      if (mockRaft) {
        return { success: true, data: mockRaft }
      } else {
        return { success: false, error: 'RAFT not found' }
      }
    }

    // Get the session with the access token
    const session = await auth()
    const accessToken = session?.accessToken

    if (!accessToken) {
      return { success: false, error: 'Not authenticated' }
    }

    // Make the API call with the access token as a Bearer token
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/rafts/internal/${id}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      },
    )

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error(`Failed to fetch RAFT with ID ${id}:`, errorData)
      return {
        success: false,
        error: errorData.message || `Request failed with status ${response.status}`,
      }
    }

    const responseData = await response.json()
    const data: RaftData = responseData.data

    return { success: true, data }
  } catch (error) {
    console.error(`Error fetching RAFT with ID ${id}:`, error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unknown error occurred',
    }
  }
}
