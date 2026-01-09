import { CANFAR_RAFT_REVIEWER_GROUP, CANFAR_USER_GROUPS_URL } from './constants'
import { parseUserGroups } from '@/auth/cadc-auth/utils/parseUserGroups'
import { TRoles } from '@/shared/model'
import { ROLE_CONTRIBUTOR, ROLE_REVIEWER } from '@/shared/constants'

interface UserRoleInfo {
  role: TRoles
  groups: string[]
}

export const fetchUserGroups = async (token?: string): Promise<UserRoleInfo> => {
  try {
    console.log('[fetchUserGroups] Fetching groups from:', CANFAR_USER_GROUPS_URL)
    console.log('[fetchUserGroups] Looking for reviewer group:', CANFAR_RAFT_REVIEWER_GROUP)

    const userGroupResponse = await fetch(`${CANFAR_USER_GROUPS_URL}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-type': 'text/plain',
      },
      credentials: 'include',
    })

    console.log('[fetchUserGroups] Response status:', userGroupResponse.status)

    if (!userGroupResponse.ok) {
      console.warn('[fetchUserGroups] Failed to fetch groups, defaulting to contributor')
      return { role: ROLE_CONTRIBUTOR, groups: [] }
    }

    const userGroups = await userGroupResponse.text()
    console.log('[fetchUserGroups] Raw groups response:', userGroups)

    const parsedGroups = parseUserGroups(userGroups)
    console.log('[fetchUserGroups] Parsed groups:', parsedGroups)

    const isRaftReviewer = parsedGroups.includes(CANFAR_RAFT_REVIEWER_GROUP)
    console.log('[fetchUserGroups] Checking if groups include:', `"${CANFAR_RAFT_REVIEWER_GROUP}"`)
    console.log(
      '[fetchUserGroups] Exact match check:',
      parsedGroups.map(
        (g) => `"${g}" === "${CANFAR_RAFT_REVIEWER_GROUP}" ? ${g === CANFAR_RAFT_REVIEWER_GROUP}`,
      ),
    )
    console.log('[fetchUserGroups] Is RAFT reviewer:', isRaftReviewer)

    const assignedRole = isRaftReviewer ? ROLE_REVIEWER : ROLE_CONTRIBUTOR
    console.log('[fetchUserGroups] Assigned role:', assignedRole)

    return {
      role: assignedRole,
      groups: parsedGroups,
    }
  } catch (error) {
    console.error('[fetchUserGroups] Error fetching user groups:', error)
    return { role: ROLE_CONTRIBUTOR, groups: [] }
  }
}
