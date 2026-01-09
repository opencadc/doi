'use server'

import { auth } from '@/auth/cadc-auth/credentials'
import { SUBMIT_DOI_URL } from '@/actions/constants'
import { parseXmlToJson } from '@/utilities/xmlParser'
import { DOIData, RaftData } from '@/types/doi'
import { downloadRaftFile } from '@/services/canfarStorage'
import { TRaftContext } from '@/context/types'
import {
  OPTION_REVIEW,
  OPTION_UNDER_REVIEW,
  OPTION_APPROVED,
  OPTION_REJECTED,
} from '@/shared/constants'

import { BACKEND_STATUS } from '@/shared/backendStatus'

// Map frontend status constants to backend status values
const STATUS_MAPPING: Record<string, string> = {
  [OPTION_REVIEW]: BACKEND_STATUS.REVIEW_READY, // review_ready -> review ready (waiting for reviewer)
  [OPTION_UNDER_REVIEW]: BACKEND_STATUS.IN_REVIEW, // under_review -> in review (reviewer claimed)
  [OPTION_APPROVED]: BACKEND_STATUS.APPROVED, // approved -> approved
  [OPTION_REJECTED]: BACKEND_STATUS.REJECTED, // rejected -> rejected
}

export interface ReviewRaftsResponse {
  data: RaftData[]
  counts: Record<string, number>
}

export const getDOIsForReview = async (
  filterStatus?: string,
): Promise<{ success: boolean; data?: ReviewRaftsResponse; error?: string }> => {
  try {
    const session = await auth()
    const accessToken = session?.accessToken

    if (!accessToken) {
      console.error('[getDOIsForReview] No access token available')
      return { success: false, error: 'Not authenticated' }
    }

    console.log('[getDOIsForReview] Fetching DOIs from:', SUBMIT_DOI_URL)

    // Fetch all DOIs
    const response = await fetch(`${SUBMIT_DOI_URL}`, {
      method: 'GET',
      headers: {
        Accept: 'application/xml',
        Cookie: `CADC_SSO=${accessToken}`,
      },
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => '')
      console.error('[getDOIsForReview] Error response:', response.status, errorText)
      return {
        success: false,
        error: `Request failed with status ${response.status}`,
      }
    }

    const xmlString = await response.text()
    const doiDataList: DOIData[] = await parseXmlToJson(xmlString)
    console.log('[getDOIsForReview] Total DOIs fetched:', doiDataList.length)

    // Calculate counts for all statuses
    const counts: Record<string, number> = {
      [OPTION_REVIEW]: 0,
      [OPTION_UNDER_REVIEW]: 0,
      [OPTION_APPROVED]: 0,
      [OPTION_REJECTED]: 0,
    }

    // Count DOIs by status
    doiDataList.forEach((doi) => {
      const backendStatus = doi.status?.toLowerCase()
      if (backendStatus === BACKEND_STATUS.REVIEW_READY) {
        counts[OPTION_REVIEW]++ // review ready (waiting for reviewer)
      } else if (backendStatus === BACKEND_STATUS.IN_REVIEW) {
        counts[OPTION_UNDER_REVIEW]++ // in review (reviewer claimed)
      } else if (backendStatus === BACKEND_STATUS.APPROVED) {
        counts[OPTION_APPROVED]++
      } else if (backendStatus === BACKEND_STATUS.REJECTED) {
        counts[OPTION_REJECTED]++
      }
    })

    console.log('[getDOIsForReview] Status counts:', counts)

    // Filter DOIs by requested status
    const backendStatus = filterStatus ? STATUS_MAPPING[filterStatus] : null
    const filteredDois = backendStatus
      ? doiDataList.filter((doi) => doi.status?.toLowerCase() === backendStatus)
      : doiDataList.filter((doi) => doi.status?.toLowerCase() === BACKEND_STATUS.REVIEW_READY)

    console.log(
      '[getDOIsForReview] Filtered DOIs count:',
      filteredDois.length,
      'for status:',
      filterStatus || 'default (in review)',
    )

    // Fetch full RAFT data for each filtered DOI
    const rafts: RaftData[] = []

    for (const doi of filteredDois) {
      try {
        // Extract identifier suffix from the full identifier (e.g., "RAFTS-7rtut-gkryn.test")
        // Full identifier format: "doi:10.80791/RAFTS-7rtut-gkryn.test" or similar
        const identifierParts = doi.identifier.split('/')
        const raftSuffix = identifierParts[identifierParts.length - 1] // Just the last part (RAFTS-xxx)

        // Download RAFT.json
        const raftResponse = await downloadRaftFile(doi.dataDirectory, accessToken)

        if (raftResponse.success && raftResponse.data) {
          const raftData = raftResponse.data as TRaftContext

          // Override status from DOI list
          if (raftData.generalInfo && doi.status) {
            raftData.generalInfo.status = doi.status as typeof raftData.generalInfo.status
          }

          // Convert to RaftData format - use raftSuffix for URL-safe ID
          rafts.push({
            _id: raftSuffix,
            id: raftSuffix,
            ...raftData,
            relatedRafts: [],
            generateForumPost: false,
            createdBy: raftData.authorInfo?.correspondingAuthor?.email || '',
            createdAt: new Date().toISOString(), // TODO: Get actual creation date if available
            updatedAt: new Date().toISOString(),
            doi: doi.identifier,
          } as RaftData)
        } else {
          console.warn('[getDOIsForReview] Could not fetch RAFT.json for:', doi.identifier)
        }
      } catch (err) {
        console.error('[getDOIsForReview] Error fetching RAFT for:', doi.identifier, err)
      }
    }

    console.log('[getDOIsForReview] Successfully fetched', rafts.length, 'RAFTs')

    return {
      success: true,
      data: {
        data: rafts,
        counts,
      },
    }
  } catch (error) {
    console.error('[getDOIsForReview] Exception:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unknown error occurred',
    }
  }
}
