'use server'

import { auth } from '@/auth/cadc-auth/credentials'
import { RaftData } from '@/types/doi'
import { loadMockRaftData } from '@/tests/mock-data-loader'
import { useMockData } from '@/config/environment'

export interface RaftApiResponse {
  message: string
  data: RaftData[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export interface GetRaftsOptions {
  page?: number
  limit?: number
  status?: string
  search?: string
}

export const getReviewReadyRafts = async (options: GetRaftsOptions = {}) => {
  try {
    // Use mock data if enabled
    if (useMockData) {
      const mockData = loadMockRaftData('review_ready')
      const response: RaftApiResponse = {
        message: 'Mock data loaded',
        data: mockData,
        meta: {
          total: mockData.length,
          page: options.page || 1,
          limit: options.limit || 10,
          totalPages: 1,
        },
      }
      return { success: true, data: response }
    }

    // Get the session with the access token
    const session = await auth()
    const accessToken = session?.accessToken

    if (!accessToken) {
      return { success: false, error: 'Not authenticated' }
    }

    // Build query parameters
    const queryParams = new URLSearchParams()
    if (options.page) queryParams.append('page', options.page.toString())
    if (options.limit) queryParams.append('limit', options.limit.toString())
    if (options.status) queryParams.append('status', options.status)
    if (options.search) queryParams.append('search', options.search)

    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : ''

    // Make the API call with the access token as a Bearer token
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/rafts/review_ready${queryString}`,
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
      console.error('Failed to fetch RAFTs:', errorData)
      return {
        success: false,
        error: errorData.message || `Request failed with status ${response.status}`,
      }
    }

    const data: RaftApiResponse = await response.json()
    return { success: true, data }
  } catch (error) {
    console.error('Error fetching RAFTs:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unknown error occurred',
    }
  }
}
