'use server'

interface RequestPasswordResetValues {
  email: string
}

/**
 * Server action for requesting a password reset
 */
export const requestPasswordReset = async (formData: RequestPasswordResetValues) => {
  try {
    // Make API call to backend password reset endpoint
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/users/request-password-reset`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      },
    )

    const data = await response.json()

    if (!response.ok) {
      return {
        success: false,
        error: data.message || 'Password reset request failed',
      }
    }

    return {
      success: true,
      message: 'If your email is registered, you will receive a password reset link',
    }
  } catch (error) {
    console.error('Password reset request error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unknown error occurred',
    }
  }
}
