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
import { SUBMIT_DOI_URL, SUCCESS, MESSAGE } from '@/actions/constants'
import { createDoiFormData } from '@/actions/utils/doiFormData'
import { IResponseData } from '@/actions/types'
import { BackendStatusType, getStatusDisplayName } from '@/shared/backendStatus'
import { downloadRaftFile, updateRaftMetadata } from '@/services/canfarStorage'
import { RaftStatusChange } from '@/types/doi'
import { BACKEND_STATUS } from '@/shared/backendStatus'

/**
 * Updates the status of a RAFT/DOI via the DOI backend service.
 * Optionally updates RAFT.json metadata (statusHistory, version) when dataDirectory is provided.
 *
 * @param doiId - The DOI identifier suffix (e.g., "RAFTS-7rtut-gkryn.test")
 * @param newStatus - The new backend status value
 * @param options - Optional: dataDirectory for metadata update, previousStatus for history
 * @returns Response with success/error information
 */
export const updateDOIStatus = async (
  doiId: string,
  newStatus: BackendStatusType,
  options?: {
    dataDirectory?: string
    previousStatus?: string
  },
): Promise<IResponseData<string>> => {
  try {
    const session = await auth()
    const accessToken = session?.accessToken

    if (!accessToken) {
      return { [SUCCESS]: false, [MESSAGE]: 'Not authenticated' }
    }

    const url = `${SUBMIT_DOI_URL}/${doiId}`

    // Backend expects multipart form data with JSON blob labeled 'doiNodeData'
    const formData = createDoiFormData({ nodeData: { status: newStatus } })

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Cookie: `CADC_SSO=${accessToken}`,
      },
      body: formData,
    })

    const responseText = await response.text()

    if (!response.ok) {
      return {
        [SUCCESS]: false,
        [MESSAGE]: `Failed to update status: ${response.status} ${responseText}`,
      }
    }

    // After successful backend status change, update RAFT.json metadata if dataDirectory provided
    if (options?.dataDirectory) {
      try {
        // Fetch current RAFT.json to get actual status for accurate fromStatus
        const currentRaft = await downloadRaftFile(options.dataDirectory, accessToken)
        const existing = (
          currentRaft.success && currentRaft.data ? currentRaft.data : {}
        ) as Record<string, unknown>
        const existingHistory = (existing.statusHistory as RaftStatusChange[]) || []
        const lastEntry = existingHistory[existingHistory.length - 1]

        // Skip if already in the target state (prevents duplicate entries)
        if (lastEntry && lastEntry.toStatus === newStatus) {
          console.info(`[updateDOIStatus] Already "${newStatus}", skipping history update`)
        } else {
          // Use actual current status from history, fall back to passed previousStatus
          const actualFromStatus = lastEntry?.toStatus || options.previousStatus || 'unknown'

          const statusChange: RaftStatusChange = {
            fromStatus: actualFromStatus,
            toStatus: newStatus,
            changedBy: session?.user?.name || '',
            changedAt: new Date().toISOString(),
          }

          const metaUpdate: Record<string, unknown> = {
            updatedAt: new Date().toISOString(),
            updatedBy: session?.user?.name || '',
          }

          metaUpdate.statusHistory = [statusChange]

          if (newStatus === BACKEND_STATUS.REVIEW_READY) {
            metaUpdate.submittedAt = new Date().toISOString()
            if (existingHistory.length > 0) {
              metaUpdate.version = ((existing.version as number) || 1) + 1
            }
          }

          await updateRaftMetadata(options.dataDirectory, metaUpdate, accessToken)
        }
      } catch (metaError) {
        console.warn('[updateDOIStatus] Metadata update failed (non-critical):', metaError)
      }
    }

    return {
      [SUCCESS]: true,
      [MESSAGE]: `RAFT status changed to ${getStatusDisplayName(newStatus)}.`,
      data: responseText,
    }
  } catch (error) {
    console.error('[updateDOIStatus] Error:', error)
    return {
      [SUCCESS]: false,
      [MESSAGE]: error instanceof Error ? error.message : 'An unknown error occurred',
    }
  }
}
