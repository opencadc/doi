import { CANFAR_LOGIN_URL } from './constants'

export const authenticateUser = async (
  username: string,
  password: string,
): Promise<string | null> => {
  try {
    const loginOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'RAFT-System/1.0',
      },
      body: new URLSearchParams({
        username,
        password,
      }),
      credentials: 'include' as RequestCredentials,
    }
    const loginResponse = await fetch(CANFAR_LOGIN_URL, loginOptions)

    if (!loginResponse.ok) {
      console.error('Login failed:', loginResponse.status, loginResponse.statusText)
      return null
    }

    // Extract the token from the response
    const token = await loginResponse.text()
    return token ? token.trim() : null
  } catch (error) {
    console.error('Authentication error:', error)
    return null
  }
}
