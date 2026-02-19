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
import { SUBMIT_DOI_URL, MESSAGE, SUCCESS } from '@/actions/constants'
import { createDoiFormData } from '@/actions/utils/doiFormData'
import { IResponseData } from '@/actions/types'
import { BACKEND_STATUS } from '@/shared/backendStatus'
import { updateRaftMetadata, downloadRaftFile } from '@/services/canfarStorage'
import { RaftStatusChange } from '@/types/doi'

/**
 * Submits a RAFT for review by changing its status from 'in progress' to 'review ready'
 *
 * Per backend API: To update status, POST a plain JSON object like { status: "review ready" }
 * to /rafts/<DOI ID> (which is /doi/instances/<DOI ID>)
 *
 * The workflow is:
 * - Author submits: in progress → review ready
 * - Reviewer claims: review ready → in review (and assigns reviewer)
 *
 * @param doiId - The DOI identifier (e.g., 'RAFTS-0001')
 * @returns Response object with success status
 */
export const submitForReview = async (
  doiId: string,
  dataDirectory?: string,
): Promise<IResponseData<string>> => {
  try {
    // Get the session with the access token
    const session = await auth()
    const accessToken = session?.accessToken

    if (!accessToken) {
      console.error('[submitForReview] No access token available')
      return { [SUCCESS]: false, [MESSAGE]: 'Not authenticated' }
    }

    const url = `${SUBMIT_DOI_URL}/${doiId}`

    // Backend expects multipart form data with JSON blob labeled 'doiNodeData'
    const formData = createDoiFormData({ nodeData: { status: BACKEND_STATUS.REVIEW_READY } })

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Cookie: `CADC_SSO=${accessToken}`,
      },
      body: formData,
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => '')
      console.error('[submitForReview] Error response:', response.status, errorText)
      return {
        [SUCCESS]: false,
        [MESSAGE]: `Failed to submit for review: ${response.status} ${errorText}`,
      }
    }

    // Update RAFT.json with submittedAt, statusHistory, and version
    if (dataDirectory) {
      try {
        // Fetch current RAFT.json to get actual status and history
        const currentRaft = await downloadRaftFile(dataDirectory, accessToken)
        const existing = (
          currentRaft.success && currentRaft.data ? currentRaft.data : {}
        ) as Record<string, unknown>
        const existingHistory = (existing.statusHistory as RaftStatusChange[]) || []
        const lastEntry = existingHistory[existingHistory.length - 1]

        // Skip metadata update if already in "review ready" state (prevents duplicate entries)
        if (lastEntry && lastEntry.toStatus === BACKEND_STATUS.REVIEW_READY) {
          console.info('[submitForReview] Already review ready, skipping history update')
        } else {
          const metaUpdate: Record<string, unknown> = {
            submittedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            updatedBy: session?.user?.name || '',
          }

          // Use actual current status as fromStatus instead of hardcoding
          const actualFromStatus = lastEntry?.toStatus || BACKEND_STATUS.IN_PROGRESS

          const statusChange: RaftStatusChange = {
            fromStatus: actualFromStatus,
            toStatus: BACKEND_STATUS.REVIEW_READY,
            changedBy: session?.user?.name || '',
            changedAt: new Date().toISOString(),
          }

          metaUpdate.statusHistory = [statusChange]

          // Increment version if this is a resubmission (has prior history)
          if (existingHistory.length > 0) {
            metaUpdate.version = ((existing.version as number) || 1) + 1
          }

          await updateRaftMetadata(dataDirectory, metaUpdate, accessToken)
        }
      } catch (metaError) {
        console.warn('[submitForReview] Metadata update failed (non-critical):', metaError)
      }
    }

    return {
      [SUCCESS]: true,
      data: 'RAFTS submitted for review successfully',
    }
  } catch (error) {
    console.error('[submitForReview] Exception:', error)
    return {
      [SUCCESS]: false,
      [MESSAGE]: error instanceof Error ? error.message : 'An unknown error occurred',
    }
  }
}

/**
 * Reverts a RAFT from review back to draft status
 *
 * Per backend API: POST plain JSON { status: "in progress" } to /rafts/<DOI ID>
 *
 * @param doiId - The DOI identifier (e.g., 'RAFTS-0001')
 * @returns Response object with success status
 */
export const revertToDraft = async (
  doiId: string,
  dataDirectory?: string,
  previousStatus?: string,
): Promise<IResponseData<string>> => {
  try {
    const session = await auth()
    const accessToken = session?.accessToken

    if (!accessToken) {
      console.error('[revertToDraft] No access token available')
      return { [SUCCESS]: false, [MESSAGE]: 'Not authenticated' }
    }

    const url = `${SUBMIT_DOI_URL}/${doiId}`

    // Backend expects multipart form data with JSON blob labeled 'doiNodeData'
    const formData = createDoiFormData({ nodeData: { status: BACKEND_STATUS.IN_PROGRESS } })

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Cookie: `CADC_SSO=${accessToken}`,
      },
      body: formData,
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => '')
      console.error('[revertToDraft] Error response:', response.status, errorText)
      return {
        [SUCCESS]: false,
        [MESSAGE]: `Failed to revert to draft: ${response.status} ${errorText}`,
      }
    }

    // Update RAFT.json metadata with status history
    if (dataDirectory) {
      try {
        // Fetch current RAFT.json to get actual status
        const currentRaft = await downloadRaftFile(dataDirectory, accessToken)
        const existing = (
          currentRaft.success && currentRaft.data ? currentRaft.data : {}
        ) as Record<string, unknown>
        const existingHistory = (existing.statusHistory as RaftStatusChange[]) || []
        const lastEntry = existingHistory[existingHistory.length - 1]

        // Skip if already in "in progress" state
        if (lastEntry && lastEntry.toStatus === BACKEND_STATUS.IN_PROGRESS) {
          console.info('[revertToDraft] Already in progress, skipping history update')
        } else {
          // Use actual current status as fromStatus
          const actualFromStatus = lastEntry?.toStatus || previousStatus || 'unknown'

          const statusChange: RaftStatusChange = {
            fromStatus: actualFromStatus,
            toStatus: BACKEND_STATUS.IN_PROGRESS,
            changedBy: session?.user?.name || '',
            changedAt: new Date().toISOString(),
          }

          await updateRaftMetadata(
            dataDirectory,
            {
              updatedAt: new Date().toISOString(),
              updatedBy: session?.user?.name || '',
              statusHistory: [statusChange],
            },
            accessToken,
          )
        }
      } catch (metaError) {
        console.warn('[revertToDraft] Metadata update failed (non-critical):', metaError)
      }
    }

    return {
      [SUCCESS]: true,
      data: 'RAFTS reverted to draft successfully',
    }
  } catch (error) {
    console.error('[revertToDraft] Exception:', error)
    return {
      [SUCCESS]: false,
      [MESSAGE]: error instanceof Error ? error.message : 'An unknown error occurred',
    }
  }
}
