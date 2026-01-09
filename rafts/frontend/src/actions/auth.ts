'use server'

import { signIn, signOut } from '@/auth/cadc-auth/credentials'

export interface AuthState {
  success: boolean
  error: null | string
}
export interface LoginFormValues {
  username: string
  password: string
  turnstileToken?: string
}

// Verify Turnstile token with Cloudflare
async function verifyTurnstile(token: string): Promise<boolean> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY
  if (!secretKey) {
    console.warn('TURNSTILE_SECRET_KEY not configured, skipping verification')
    return true
  }

  try {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        secret: secretKey,
        response: token,
      }),
    })

    const data = await response.json()
    return data.success === true
  } catch (error) {
    console.error('Turnstile verification error:', error)
    return false
  }
}

export const authenticateUser = async (prevState: AuthState | null, formData: LoginFormValues) => {
  try {
    // Verify Turnstile token if provided
    if (formData.turnstileToken) {
      const isValid = await verifyTurnstile(formData.turnstileToken)
      if (!isValid) {
        return {
          success: false,
          error: 'Security verification failed. Please try again.',
        }
      }
    } else if (process.env.TURNSTILE_SECRET_KEY) {
      // Turnstile is configured but no token provided
      return {
        success: false,
        error: 'Security verification required',
      }
    }

    await signIn('credentials', {
      username: formData.username,
      password: formData.password,
      redirect: false,
    })

    return { success: true, error: null }
  } catch (error) {
    console.error('Authentication error:', error)
    return {
      success: false,
      error: 'Invalid credentials or server error',
    }
  }
}

export const handleSignOut = async () => {
  try {
    await signOut()
    return { success: true }
  } catch (error) {
    console.error('Error during sign out:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}
