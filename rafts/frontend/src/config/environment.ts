// Environment configuration helper
export const isDevelopment = process.env.NODE_ENV === 'development'
export const isProduction = process.env.NODE_ENV === 'production'

// Check if review UI is enabled (which also enables mock data in development)
export const isReviewEnabled = process.env.UI_REVIEW_ENABLED === 'true' || false

// Check if we should use mock data
// When review is enabled, we use mock data (in both development and production for now)
export const useMockData = isReviewEnabled

// Helper to check if API is available
export const isApiAvailable = async (): Promise<boolean> => {
  if (!process.env.NEXT_PUBLIC_API_BASE_URL) return false

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(1000), // 1 second timeout
    }).catch(() => null)

    return response?.ok || false
  } catch {
    return false
  }
}
