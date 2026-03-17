'use server'

import { STORAGE_VAULT_FILE_URL, DOI_XML_PREFIX } from '@/utilities/constants'

/**
 * Fetches the DataCite citation XML for a RAFT from the VOSpace vault.
 * Proxied through the server to avoid CORS restrictions.
 */
export const fetchDoiCitationXml = async (
  dataDirectory: string,
): Promise<{ success: boolean; xml?: string; error?: string }> => {
  try {
    const raftRootDir = dataDirectory.replace(/\/data\/?$/, '')
    const raftFolderName = raftRootDir.split('/').pop()
    if (!raftFolderName) {
      return { success: false, error: 'Could not determine RAFT folder name' }
    }

    const url = `${STORAGE_VAULT_FILE_URL}${raftRootDir.startsWith('/') ? '' : '/'}${raftRootDir}/${DOI_XML_PREFIX}${raftFolderName}.xml`
    console.log(`[fetchDoiCitationXml] Fetching: ${url}`)

    const response = await fetch(url, { redirect: 'follow' })

    if (!response.ok) {
      return { success: false, error: `HTTP ${response.status}` }
    }

    const xml = await response.text()
    return { success: true, xml }
  } catch (error) {
    console.error('[fetchDoiCitationXml] Error:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}
