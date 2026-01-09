'use server'

import { auth } from '@/auth/cadc-auth/credentials'

interface ChangeRoleResponse {
  success: boolean
  error?: string
  message?: string
}

/**
 * Server action to change a user's role
 * Requires admin role
 *
 * @param {string} userId - ID of the user to update
 * @param {string} newRole - New role to assign
 * @returns {Promise<ChangeRoleResponse>}
 */
export const changeUserRole = async (
  userId: string,
  newRole: string,
): Promise<ChangeRoleResponse> => {
  try {
    // Get the session with the access token
    const session = await auth()
    const accessToken = session?.accessToken
    const userRole = session?.user?.role
    // Check if user is authenticated
    if (!accessToken) {
      return { success: false, error: 'Not authenticated' }
    }

    // Verify admin role
    if (userRole !== 'admin') {
      return { success: false, error: 'Unauthorized. Admin role required.' }
    }

    // Validate role
    const validRoles = ['admin', 'reviewer', 'contributor']
    if (!validRoles.includes(newRole)) {
      return { success: false, error: 'Invalid role specified' }
    }

    // Make the API call to update the user role
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/users/${userId}/role`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'RAFT-System/1.0',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ role: newRole }),
      },
    )

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('Failed to change user role:', errorData)
      return {
        success: false,
        error: errorData.message || `Request failed with status ${response.status}`,
      }
    }

    const responseData = await response.json()
    return {
      success: true,
      message: responseData.message || `User role updated to ${newRole}`,
    }
  } catch (error) {
    console.error('Error changing user role:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unknown error occurred',
    }
  }
}
