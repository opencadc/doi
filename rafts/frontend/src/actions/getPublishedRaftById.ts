'use server'

import { RaftData } from '@/types/doi'

export const getPublishedRaftById = async (id: string) => {
  try {
    // Get the session with the access token

    // Make the API call with the access token as a Bearer token
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/rafts/published/${id}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
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
