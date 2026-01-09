'use server'

import { auth } from '@/auth/cadc-auth/credentials'
import { RaftReview } from '@/types/reviews'

interface AddCommentParams {
  content: string
  location?: string
}

/**
 * Adds a comment to a RAFT review
 *
 * @param reviewId - The ID of the review to add a comment to
 * @param params - Comment parameters (content and optional location)
 * @returns Response with success status and updated review data
 */
export const submitReviewComment = async (
  reviewId: string,
  params: AddCommentParams,
): Promise<{
  success: boolean
  data?: RaftReview
  error?: string
}> => {
  try {
    // Get the session with the access token
    const session = await auth()
    const accessToken = session?.accessToken

    if (!accessToken) {
      return { success: false, error: 'Not authenticated' }
    }

    // Validate required fields
    if (!params.content || params.content.trim() === '') {
      return { success: false, error: 'Comment content is required' }
    }

    // Prepare the request payload
    const payload = {
      content: params.content,
      ...(params.location && { location: params.location }),
    }

    // Make the API call with the access token as a Bearer token
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/reviews/${reviewId}/comments`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      },
    )

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error(`Failed to add comment to review ${reviewId}:`, errorData)
      return {
        success: false,
        error: errorData.message || `Request failed with status ${response.status}`,
      }
    }

    const responseData = await response.json()
    return {
      success: true,
      data: responseData.data,
    }
  } catch (error) {
    console.error(`Error adding comment to review ${reviewId}:`, error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unknown error occurred',
    }
  }
}
