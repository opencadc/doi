/*
 ************************************************************************
 *******************  CANADIAN ASTRONOMY DATA CENTRE  *******************
 **************  CENTRE CANADIEN DE DONNÉES ASTRONOMIQUES  **************
 *
 *  (c) 2026.                            (c) 2026.
 *  Government of Canada                 Gouvernement du Canada
 *  National Research Council            Conseil national de recherches
 *  Ottawa, Canada, K1A 0R6              Ottawa, Canada, K1A 0R6
 *  All rights reserved                  Tous droits réservés
 *
 *  NRC disclaims any warranties,        Le CNRC dénie toute garantie
 *  expressed, implied, or               énoncée, implicite ou légale,
 *  statutory, of any kind with          de quelque nature que ce
 *  respect to the software,             soit, concernant le logiciel,
 *  including without limitation         y compris sans restriction
 *  any warranty of merchantability      toute garantie de valeur
 *  or fitness for a particular          marchande ou de pertinence
 *  purpose. NRC shall not be            pour un usage particulier.
 *  liable in any event for any          Le CNRC ne pourra en aucun cas
 *  damages, whether direct or           être tenu responsable de tout
 *  indirect, special or general,        dommage, direct ou indirect,
 *  consequential or incidental,         particulier ou général,
 *  arising from the use of the          accessoire ou fortuit, résultant
 *  software.  Neither the name          de l'utilisation du logiciel. Ni
 *  of the National Research             le nom du Conseil National de
 *  Council of Canada nor the            Recherches du Canada ni les noms
 *  names of its contributors may        de ses  participants ne peuvent
 *  be used to endorse or promote        être utilisés pour approuver ou
 *  products derived from this           promouvoir les produits dérivés
 *  software without specific prior      de ce logiciel sans autorisation
 *  written permission.                  préalable et particulière
 *                                       par écrit.
 *
 *  This file is part of the             Ce fichier fait partie du projet
 *  OpenCADC project.                    OpenCADC.
 *
 *  OpenCADC is free software:           OpenCADC est un logiciel libre ;
 *  you can redistribute it and/or       vous pouvez le redistribuer ou le
 *  modify it under the terms of         modifier suivant les termes de
 *  the GNU Affero General Public        la "GNU Affero General Public
 *  License as published by the          License" telle que publiée
 *  Free Software Foundation,            par la Free Software Foundation
 *  either version 3 of the              : soit la version 3 de cette
 *  License, or (at your option)         licence, soit (à votre gré)
 *  any later version.                   toute version ultérieure.
 *
 *  OpenCADC is distributed in the       OpenCADC est distribué
 *  hope that it will be useful,         dans l'espoir qu'il vous
 *  but WITHOUT ANY WARRANTY;            sera utile, mais SANS AUCUNE
 *  without even the implied             GARANTIE : sans même la garantie
 *  warranty of MERCHANTABILITY          implicite de COMMERCIALISABILITÉ
 *  or FITNESS FOR A PARTICULAR          ni d'ADÉQUATION À UN OBJECTIF
 *  PURPOSE.  See the GNU Affero         PARTICULIER. Consultez la Licence
 *  General Public License for           Générale Publique GNU Affero
 *  more details.                        pour plus de détails.
 *
 *  You should have received             Vous devriez avoir reçu une
 *  a copy of the GNU Affero             copie de la Licence Générale
 *  General Public License along         Publique GNU Affero avec
 *  with OpenCADC.  If not, see          OpenCADC ; si ce n'est
 *  <http://www.gnu.org/licenses/>.      pas le cas, consultez :
 *                                       <http://www.gnu.org/licenses/>.
 *
 ************************************************************************
 */

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
      if (response.status === 401 || response.status === 403) {
        return { success: false, error: '401' }
      }
      return {
        success: false,
        error: `Request failed with status ${response.status}`,
      }
    }

    const xmlString = await response.text()
    const doiDataList: DOIData[] = await parseXmlToJson(xmlString)

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

    // Filter DOIs by requested status
    const backendStatus = filterStatus ? STATUS_MAPPING[filterStatus] : null
    const filteredDois = backendStatus
      ? doiDataList.filter((doi) => doi.status?.toLowerCase() === backendStatus)
      : doiDataList.filter((doi) => doi.status?.toLowerCase() === BACKEND_STATUS.REVIEW_READY)

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
          // Preserve metadata from RAFT.json if available, fall back to defaults
          rafts.push({
            _id: raftSuffix,
            id: raftSuffix,
            ...raftData,
            relatedRafts: [],
            generateForumPost: false,
            createdBy:
              ((raftData as Record<string, unknown>).createdBy as string) ||
              raftData.authorInfo?.correspondingAuthor?.email ||
              '',
            createdAt: ((raftData as Record<string, unknown>).createdAt as string) || '',
            updatedAt: ((raftData as Record<string, unknown>).updatedAt as string) || '',
            doi: doi.identifier,
            dataDirectory: doi.dataDirectory,
            submittedAt: (raftData as Record<string, unknown>).submittedAt as string | undefined,
            version: (raftData as Record<string, unknown>).version as number | undefined,
            statusHistory: (raftData as Record<string, unknown>).statusHistory as
              | RaftData['statusHistory']
              | undefined,
          } as RaftData)
        } else {
          console.warn('[getDOIsForReview] Could not fetch RAFT.json for:', doi.identifier)
        }
      } catch (err) {
        console.error('[getDOIsForReview] Error fetching RAFT for:', doi.identifier, err)
      }
    }

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
