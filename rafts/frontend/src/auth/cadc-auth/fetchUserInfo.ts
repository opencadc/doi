import { CANFAR_USER_URL } from './constants'
import { parseUserInfo } from '@/auth/cadc-auth/utils/parseUserInfo'
import { TPerson } from '@/shared/model'

export const fetchUserInfo = async (token?: string): Promise<TPerson | null> => {
  try {
    const userResponse = await fetch(`${CANFAR_USER_URL}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
      credentials: 'include',
    })

    if (!userResponse.ok) {
      console.warn('Could not fetch user data:', userResponse.status, userResponse.statusText)
      return null
    }

    const userData = await userResponse.json()
    return parseUserInfo(userData)
  } catch (error) {
    console.warn('Error fetching user data:', error)
    return null
  }
}
