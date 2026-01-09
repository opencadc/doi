'use server'

import { auth } from '@/auth/cadc-auth/credentials'

export interface User {
  _id: string
  firstName: string
  lastName: string
  email: string
  affiliation?: string
  role: string
  isEmailVerified: boolean
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface GetUsersResponse {
  success: boolean
  data?: User[]
  error?: string
  meta?: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export interface GetUsersOptions {
  page?: number
  limit?: number
  search?: string
  role?: string
}

/**
 * Server action to fetch all users from the backend API
 * Requires admin role
 *
 * @param {GetUsersOptions} options - Options for pagination, filtering, etc.
 * @returns {Promise<GetUsersResponse>}
 */
export const getUsers = async (options: GetUsersOptions = {}): Promise<GetUsersResponse> => {
  try {
    // Get the session with the access token
    const session = await auth()
    const accessToken = session?.accessToken
    const userRole = session?.user?.role

    // Check if user is authenticated
    if (!accessToken) {
      return { success: false, error: 'Not authenticated' }
    }

    // Verify admin role
    if (userRole !== 'admin') {
      return { success: false, error: 'Unauthorized. Admin role required.' }
    }

    // Build query parameters
    const queryParams = new URLSearchParams()
    if (options.page) queryParams.append('page', options.page.toString())
    if (options.limit) queryParams.append('limit', options.limit.toString())
    if (options.search) queryParams.append('search', options.search)
    if (options.role) queryParams.append('role', options.role)

    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : ''

    // Make the API call with the access token as a Bearer token
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/users${queryString}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'RAFT-System/1.0',
          Authorization: `Bearer ${accessToken}`,
        },
      },
    )

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('Failed to fetch users:', errorData)
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
    console.error('Error fetching users:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unknown error occurred',
    }
  }
}
