'use server'

import { auth } from '@/auth/cadc-auth/credentials'
import { RaftReview } from '@/types/reviews'
import { useMockData } from '@/config/environment'
import { getMockRaftById } from '@/tests/mock-data-loader'

export const getRaftReview = async (raftId: string) => {
  try {
    // Use mock data if enabled
    if (useMockData) {
      const mockRaft = getMockRaftById(raftId)

      if (!mockRaft) {
        return { success: false, error: 'RAFT not found' }
      }

      // Create a mock review based on the RAFT status
      const mockReview: RaftReview = {
        _id: `review-${raftId}`,
        raftId: raftId,
        currentVersion: 1,
        versions: [
          {
            versionNumber: 1,
            raftData: mockRaft,
            createdAt: mockRaft.createdAt,
            createdBy: {
              _id: 'mock-user-1',
              firstName: 'Mock',
              lastName: 'User',
            },
            commitMessage: 'Initial submission',
            _id: `version-${raftId}-1`,
          },
        ],
        statusHistory:
          mockRaft.generalInfo.status !== 'review_ready'
            ? [
                {
                  fromStatus: 'review_ready',
                  toStatus: mockRaft.generalInfo.status,
                  changedBy: {
                    _id: 'mock-reviewer-1',
                    firstName: 'Mock',
                    lastName: 'Reviewer',
                  },
                  changedAt: mockRaft.updatedAt,
                  reason: `Status changed to ${mockRaft.generalInfo.status}`,
                  _id: `status-change-${raftId}-1`,
                },
              ]
            : [],
        comments:
          mockRaft.generalInfo.status === 'rejected'
            ? [
                {
                  _id: `comment-${raftId}-1`,
                  content: 'This submission needs more data to support the findings.',
                  createdBy: {
                    _id: 'mock-reviewer-1',
                    firstName: 'Mock',
                    lastName: 'Reviewer',
                  },
                  createdAt: mockRaft.updatedAt,
                  isResolved: false,
                },
              ]
            : [],
        assignedReviewers: [
          {
            _id: 'mock-reviewer-1',
            firstName: 'Mock',
            lastName: 'Reviewer',
          },
        ],
        isActive:
          mockRaft.generalInfo.status !== 'approved' && mockRaft.generalInfo.status !== 'rejected',
        createdAt: mockRaft.createdAt,
        updatedAt: mockRaft.updatedAt,
      }

      return { success: true, data: mockReview }
    }

    // Get the session with the access token
    const session = await auth()
    const accessToken = session?.accessToken

    if (!accessToken) {
      return { success: false, error: 'Not authenticated' }
    }

    // Make the API call with the access token as a Bearer token
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/reviews/by-raft/${raftId}`,
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
      console.error(`Failed to fetch reviews for RAFT ${raftId}:`, errorData)
      return {
        success: false,
        error: errorData.message || `Request failed with status ${response.status}`,
      }
    }

    const responseData = await response.json()
    const data: RaftReview = responseData.data

    return { success: true, data }
  } catch (error) {
    console.error(`Error fetching reviews for RAFT ${raftId}:`, error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unknown error occurred',
    }
  }
}
