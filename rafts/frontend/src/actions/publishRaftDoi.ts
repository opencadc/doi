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
import { IResponseData } from '@/actions/types'
import { BACKEND_STATUS } from '@/shared/backendStatus'
import { getDOICurrentStatus } from '@/actions/updateDOIStatus'

const POLL_INTERVAL_MS = 3000
const MAX_POLL_ATTEMPTS = 40 // 2 minutes max for locking phase

const ERROR_STATUSES: string[] = [BACKEND_STATUS.ERROR_LOCKING_DATA, BACKEND_STATUS.ERROR_REGISTERING]

/**
 * Call POST /mint once.
 */
async function callMint(
  raftId: string,
  accessToken: string,
): Promise<{ ok: boolean; status: number; text: string }> {
  const url = `${SUBMIT_DOI_URL}/${raftId}/mint`
  console.log(`[publishRAFTDOI] POST ${url}`)

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Cookie: `CADC_SSO=${accessToken}`,
    },
    body: '',
  })

  const text = await response.text()
  console.log(`[publishRAFTDOI] ${raftId}: mint response ${response.status}`, text)

  return { ok: response.ok, status: response.status, text }
}

/**
 * Mints/Publishes a DOI for a RAFT submission via the DOI backend.
 *
 * The backend mint workflow is a 3-step state machine (confirmed from Java source):
 *
 * Step 1: POST /mint  → starts async data locking → status: LOCKING_DATA
 * Step 2: Poll GET /status → the GET triggers LOCKING_DATA → LOCKED_DATA when job completes
 * Step 3: POST /mint  → synchronous DataCite registration → status: MINTED
 *
 * @param raftId - The DOI identifier suffix (e.g., "RAFTS-7rtut-gkryn.test")
 * @returns Response object with success status and message
 */
export const publishRAFTDOI = async (
  raftId: string,
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

    // Check current status to determine where to resume
    const currentStatus = await getDOICurrentStatus(raftId, accessToken)
    console.log(`[publishRAFTDOI] ${raftId}: starting, current status: "${currentStatus}"`)

    // --- Step 1: Start locking (if not already locked) ---
    if (
      currentStatus === BACKEND_STATUS.APPROVED ||
      currentStatus === BACKEND_STATUS.ERROR_LOCKING_DATA
    ) {
      console.log(`[publishRAFTDOI] ${raftId}: Step 1 - starting data lock`)
      const result = await callMint(raftId, accessToken)
      if (!result.ok) {
        return { [SUCCESS]: false, [MESSAGE]: `Mint failed: ${result.status} ${result.text}` }
      }

      const statusAfterMint = await getDOICurrentStatus(raftId, accessToken)
      console.log(`[publishRAFTDOI] ${raftId}: status after Step 1: "${statusAfterMint}"`)

      if (statusAfterMint && ERROR_STATUSES.includes(statusAfterMint)) {
        return { [SUCCESS]: false, [MESSAGE]: `Publishing failed: ${statusAfterMint}` }
      }
    }

    // --- Step 2: Poll status until LOCKED_DATA (GET /status triggers the transition) ---
    const statusBeforePoll = await getDOICurrentStatus(raftId, accessToken)
    if (
      statusBeforePoll === BACKEND_STATUS.LOCKING_DATA ||
      statusBeforePoll === BACKEND_STATUS.APPROVED
    ) {
      console.log(`[publishRAFTDOI] ${raftId}: Step 2 - polling for lock completion`)

      for (let i = 0; i < MAX_POLL_ATTEMPTS; i++) {
        await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS))

        // GET /status itself triggers the LOCKING_DATA → LOCKED_DATA transition
        const status = await getDOICurrentStatus(raftId, accessToken)
        console.log(`[publishRAFTDOI] ${raftId}: poll ${i + 1}/${MAX_POLL_ATTEMPTS}, status: "${status}"`)

        if (status === BACKEND_STATUS.LOCKED_DATA) {
          console.log(`[publishRAFTDOI] ${raftId}: data locked`)
          break
        }

        if (status === BACKEND_STATUS.MINTED) {
          console.log(`[publishRAFTDOI] ${raftId}: already minted`)
          return { [SUCCESS]: true, [MESSAGE]: 'RAFTS status changed to Published.' }
        }

        if (status && ERROR_STATUSES.includes(status)) {
          return { [SUCCESS]: false, [MESSAGE]: `Publishing failed: ${status}` }
        }

        if (i === MAX_POLL_ATTEMPTS - 1) {
          return {
            [SUCCESS]: false,
            [MESSAGE]: 'Data locking timed out. Use "Resume Publishing" to continue.',
          }
        }
      }
    }

    // --- Step 3: Register with DataCite (synchronous) ---
    const statusBeforeRegister = await getDOICurrentStatus(raftId, accessToken)
    if (statusBeforeRegister === BACKEND_STATUS.MINTED) {
      return { [SUCCESS]: true, [MESSAGE]: 'RAFTS status changed to Published.' }
    }

    if (
      statusBeforeRegister === BACKEND_STATUS.LOCKED_DATA ||
      statusBeforeRegister === BACKEND_STATUS.ERROR_REGISTERING
    ) {
      console.log(`[publishRAFTDOI] ${raftId}: Step 3 - registering with DataCite`)
      const result = await callMint(raftId, accessToken)
      if (!result.ok) {
        return { [SUCCESS]: false, [MESSAGE]: `Mint failed: ${result.status} ${result.text}` }
      }

      const finalStatus = await getDOICurrentStatus(raftId, accessToken)
      console.log(`[publishRAFTDOI] ${raftId}: final status: "${finalStatus}"`)

      if (finalStatus === BACKEND_STATUS.MINTED) {
        console.log(`[publishRAFTDOI] ${raftId}: minted successfully`)
        return { [SUCCESS]: true, [MESSAGE]: 'RAFTS status changed to Published.' }
      }

      if (finalStatus && ERROR_STATUSES.includes(finalStatus)) {
        return { [SUCCESS]: false, [MESSAGE]: `Publishing failed: ${finalStatus}` }
      }
    }

    // Unexpected state
    const unexpectedStatus = await getDOICurrentStatus(raftId, accessToken)
    console.error(`[publishRAFTDOI] ${raftId}: unexpected status: "${unexpectedStatus}"`)
    return {
      [SUCCESS]: false,
      [MESSAGE]: `Unexpected status: ${unexpectedStatus}. Use "Resume Publishing" to continue.`,
    }
  } catch (error) {
    console.error('[publishRAFTDOI] Error:', error)
    return {
      [SUCCESS]: false,
      [MESSAGE]: error instanceof Error ? error.message : 'An unknown error occurred',
    }
  }
}

/**
 * Get the current minting status for UI progress display.
 * Can be called by the UI to poll progress while publishRAFTDOI is running.
 */
export const getMintingStatus = async (
  raftId: string,
): Promise<{ status: string | null; step: number; label: string }> => {
  const session = await auth()
  const accessToken = session?.accessToken

  if (!accessToken) {
    return { status: null, step: 0, label: 'Not authenticated' }
  }

  const status = await getDOICurrentStatus(raftId, accessToken)

  switch (status) {
    case BACKEND_STATUS.APPROVED:
      return { status, step: 0, label: 'Starting...' }
    case BACKEND_STATUS.LOCKING_DATA:
      return { status, step: 1, label: 'Locking data...' }
    case BACKEND_STATUS.LOCKED_DATA:
      return { status, step: 2, label: 'Registering...' }
    case BACKEND_STATUS.REGISTERING:
      return { status, step: 2, label: 'Registering...' }
    case BACKEND_STATUS.MINTED:
      return { status, step: 3, label: 'Published' }
    case BACKEND_STATUS.ERROR_LOCKING_DATA:
      return { status, step: 1, label: 'Error locking data' }
    case BACKEND_STATUS.ERROR_REGISTERING:
      return { status, step: 2, label: 'Error registering' }
    default:
      return { status, step: 0, label: status || 'Unknown' }
  }
}
