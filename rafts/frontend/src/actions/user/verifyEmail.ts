'use server'

/**
 * Verifies a user's email address by token
 */
export const verifyEmail = async (token: string) => {
  try {
    // Call the API endpoint to verify the email
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/users/verify-email/${token}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      },
    )

    const data = await response.json()

    if (!response.ok) {
      return {
        success: false,
        error: data.message || 'Email verification failed',
      }
    }

    return {
      success: true,
      message: 'Email verified successfully. You can now sign in.',
    }
  } catch (error) {
    console.error('Email verification error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unknown error occurred',
    }
  }
}
