'use server'

import { auth } from '@/auth/cadc-auth/credentials'
import { RaftData } from '@/types/doi'

export interface UserRaftsResponse {
  success: boolean
  data?: RaftData[]
  error?: string
  meta?: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

/**
 * Fetches all RAFTs associated with a specific user
 *
 * @param userId - Optional user ID to fetch RAFTs for (defaults to current authenticated user)
 * @param options - Optional pagination and filtering options
 * @returns Response containing RAFTs data or error information
 */
export const getUserRafts = async (
  userId?: string,
  options: { page?: number; limit?: number; status?: string } = {},
): Promise<UserRaftsResponse> => {
  try {
    // Get the session with the access token
    const session = await auth()
    const accessToken = session?.accessToken

    if (!accessToken) {
      return { success: false, error: 'Not authenticated' }
    }

    // Determine user ID - either provided or current user
    const targetUserId = userId || session.user?.id || 'current'

    // Build query parameters for pagination/filtering
    const queryParams = new URLSearchParams()
    if (options.page) queryParams.append('page', options.page.toString())
    if (options.limit) queryParams.append('limit', options.limit.toString())
    if (options.status) queryParams.append('status', options.status)

    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : ''

    // Make the API call with the access token as a Bearer token
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/rafts/user/${targetUserId}${queryString}`,
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
      console.error(`Failed to fetch user RAFTs:`, errorData)
      return {
        success: false,
        error: errorData.message || `Request failed with status ${response.status}`,
      }
    }

    const responseData = await response.json()

    return {
      success: true,
      data: responseData.data,
      meta: responseData.meta,
    }
  } catch (error) {
    console.error(`Error fetching user RAFTs:`, error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unknown error occurred',
    }
  }
}
