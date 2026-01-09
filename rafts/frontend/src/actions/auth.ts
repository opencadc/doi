'use server'

import { signIn, signOut } from '@/auth/cadc-auth/credentials'

export interface AuthState {
  success: boolean
  error: null | string
}
export interface LoginFormValues {
  username: string
  password: string
}

export const authenticateUser = async (prevState: AuthState | null, formData: LoginFormValues) => {
  try {
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
