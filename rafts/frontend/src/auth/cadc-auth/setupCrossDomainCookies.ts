export const setupCrossDomainCookies = async (
  token: string,
  endpointUrl: string,
): Promise<boolean> => {
  try {
    const secondOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      credentials: 'include' as RequestCredentials,
    }

    const secondResponse = await fetch(endpointUrl, secondOptions)

    if (!secondResponse.ok) {
      console.warn(
        'Cross-domain cookie setup failed:',
        secondResponse.status,
        secondResponse.statusText,
      )
      return false
    }

    return true
  } catch (error) {
    console.warn('Error setting up cross-domain cookies:', error)
    return false
  }
}
