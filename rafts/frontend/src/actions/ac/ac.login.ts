'use server'

/**
 * Server action for user login using CADC login service
 * Based on cap.xml "ivo://ivoa.net/sso#tls-with-password" capability
 */

// URL from cap.xml for login
const LOGIN_URL = 'https://ws-cadc.canfar.net/ac/login'

export interface LoginData {
  username: string
  password: string
}

export async function loginUser(formData: LoginData) {
  try {
    // Convert the form data to application/x-www-form-urlencoded format
    const formBody = new URLSearchParams({
      username: formData.username,
      password: formData.password,
    }).toString()

    // Call the CADC login endpoint
    const response = await fetch(LOGIN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'RAFT-System/1.0',
      },
      body: formBody,
    })

    if (!response.ok) {
      return {
        success: false,
        error: `Login failed with status ${response.status}`,
      }
    }

    // Extract the authentication token from the response
    const token = await response.text()

    if (!token) {
      return {
        success: false,
        error: 'No authentication token received',
      }
    }

    // Return the token for session creation
    return {
      success: true,
      token: token.trim(),
      username: formData.username,
    }
  } catch (error) {
    console.error('Login error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during login',
    }
  }
}
