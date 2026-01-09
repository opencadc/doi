'use server'

interface RegisterFormValues {
  firstName: string
  lastName: string
  email: string
  password: string
  affiliation?: string
}

/**
 * Server action for user registration
 */
export const registerUser = async (formData: RegisterFormValues) => {
  try {
    // Make API call to backend registration endpoint
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/users/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    })

    const data = await response.json()

    if (!response.ok) {
      return {
        success: false,
        error: data.message || 'Registration failed',
      }
    }

    return {
      success: true,
      message: 'Registration successful. Please check your email to verify your account.',
    }
  } catch (error) {
    console.error('Registration error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unknown error occurred',
    }
  }
}
