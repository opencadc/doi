// src/actions/user/resetPassword.ts
'use server'

interface ResetPasswordData {
  token: string
  newPassword: string
}

/**
 * Resets a user's password using the reset token
 */
export const resetPassword = async ({ token, newPassword }: ResetPasswordData) => {
  try {
    // Call the API endpoint to reset the password
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/users/reset-password`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, newPassword }),
      },
    )

    const data = await response.json()

    if (!response.ok) {
      return {
        success: false,
        error: data.message || 'Password reset failed',
      }
    }

    return {
      success: true,
      message: 'Password has been reset successfully. You can now sign in.',
    }
  } catch (error) {
    console.error('Password reset error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unknown error occurred',
    }
  }
}
