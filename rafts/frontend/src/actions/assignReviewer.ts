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
import { updateRaftMetadata } from '@/services/canfarStorage'
import { RaftStatusChange } from '@/types/doi'

/**
 * Assigns a reviewer to a RAFT/DOI.
 * Only publishers (members of RAFTS-test-reviewers group) can assign reviewers.
 *
 * The reviewer is stored as ivo://cadc.nrc.ca/vospace/doi#reviewer property.
 *
 * @param doiId - The DOI identifier suffix (e.g., "RAFTS-7rtut-gkryn.test")
 * @param reviewerUsername - The username of the reviewer to assign
 * @returns Response with success/error information
 */
export const assignReviewer = async (
  doiId: string,
  reviewerUsername: string,
): Promise<IResponseData<string>> => {
  try {
    const session = await auth()
    const accessToken = session?.accessToken

    if (!accessToken) {
      return { [SUCCESS]: false, [MESSAGE]: 'Not authenticated' }
    }

    const url = `${SUBMIT_DOI_URL}/${doiId}`

    // Backend expects multipart form data with JSON blob labeled 'doiNodeData'
    const formData = createDoiFormData({ nodeData: { reviewer: reviewerUsername } })

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Cookie: `CADC_SSO=${accessToken}`,
      },
      body: formData,
      redirect: 'manual', // Backend returns 303 on success
    })

    // 303 redirect means success
    if (response.status === 303) {
      return {
        [SUCCESS]: true,
        data: `Reviewer "${reviewerUsername}" assigned successfully`,
      }
    }

    if (!response.ok) {
      const errorText = await response.text().catch(() => '')
      console.error('[assignReviewer] Error response:', response.status, errorText)
      return {
        [SUCCESS]: false,
        [MESSAGE]: `Failed to assign reviewer: ${response.status} ${errorText}`,
      }
    }

    return {
      [SUCCESS]: true,
      data: `Reviewer "${reviewerUsername}" assigned successfully`,
    }
  } catch (error) {
    console.error('[assignReviewer] Exception:', error)
    return {
      [SUCCESS]: false,
      [MESSAGE]: error instanceof Error ? error.message : 'An unknown error occurred',
    }
  }
}

/**
 * Claims a RAFT for review by assigning the current user as the reviewer
 * AND changing the status to "in review" in a single API call.
 *
 * This does two things in one call:
 * 1. Assigns the reviewer
 * 2. Changes status from "review ready" → "in review"
 *
 * @param doiId - The DOI identifier suffix (e.g., "RAFTS-7rtut-gkryn.test")
 * @returns Response with success/error information
 */
export const claimForReview = async (
  doiId: string,
  dataDirectory?: string,
): Promise<IResponseData<string>> => {
  try {
    const session = await auth()
    const accessToken = session?.accessToken

    if (!accessToken) {
      return { [SUCCESS]: false, [MESSAGE]: 'Not authenticated' }
    }

    if (!session?.user?.name) {
      return { [SUCCESS]: false, [MESSAGE]: 'Username not available' }
    }

    const reviewerName = session.user.name
    const url = `${SUBMIT_DOI_URL}/${doiId}`

    // Backend supports setting both reviewer and status in one call
    const formData = createDoiFormData({
      nodeData: { reviewer: reviewerName, status: BACKEND_STATUS.IN_REVIEW },
    })

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Cookie: `CADC_SSO=${accessToken}`,
      },
      body: formData,
      redirect: 'manual',
    })

    if (response.status === 303 || response.ok) {
      // Update RAFT.json metadata with status history
      if (dataDirectory) {
        try {
          const statusChange: RaftStatusChange = {
            fromStatus: BACKEND_STATUS.REVIEW_READY,
            toStatus: BACKEND_STATUS.IN_REVIEW,
            changedBy: reviewerName,
            changedAt: new Date().toISOString(),
          }

          await updateRaftMetadata(
            dataDirectory,
            {
              updatedAt: new Date().toISOString(),
              updatedBy: reviewerName,
              statusHistory: [statusChange],
            },
            accessToken,
          )
        } catch (metaError) {
          console.warn('[claimForReview] Metadata update failed (non-critical):', metaError)
        }
      }

      return {
        [SUCCESS]: true,
        data: `RAFT claimed for review by "${reviewerName}"`,
      }
    }

    const errorText = await response.text().catch(() => '')
    console.error('[claimForReview] Error response:', response.status, errorText)
    return {
      [SUCCESS]: false,
      [MESSAGE]: `Failed to claim for review: ${response.status} ${errorText}`,
    }
  } catch (error) {
    console.error('[claimForReview] Exception:', error)
    return {
      [SUCCESS]: false,
      [MESSAGE]: error instanceof Error ? error.message : 'An unknown error occurred',
    }
  }
}

/**
 * Releases a review by unassigning the reviewer AND changing status back to "review ready".
 * Only publishers can release reviews.
 *
 * This does two things in one call:
 * 1. Removes the reviewer assignment
 * 2. Changes status from "in review" → "review ready"
 *
 * @param doiId - The DOI identifier suffix (e.g., "RAFTS-7rtut-gkryn.test")
 * @returns Response with success/error information
 */
export const releaseReview = async (
  doiId: string,
  dataDirectory?: string,
): Promise<IResponseData<string>> => {
  try {
    const session = await auth()
    const accessToken = session?.accessToken

    if (!accessToken) {
      return { [SUCCESS]: false, [MESSAGE]: 'Not authenticated' }
    }

    const url = `${SUBMIT_DOI_URL}/${doiId}`

    // Send empty reviewer and status back to review ready
    const formData = createDoiFormData({
      nodeData: { reviewer: '', status: BACKEND_STATUS.REVIEW_READY },
    })

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Cookie: `CADC_SSO=${accessToken}`,
      },
      body: formData,
      redirect: 'manual',
    })

    if (response.status === 303 || response.ok) {
      // Update RAFT.json metadata with status history
      if (dataDirectory) {
        try {
          const statusChange: RaftStatusChange = {
            fromStatus: BACKEND_STATUS.IN_REVIEW,
            toStatus: BACKEND_STATUS.REVIEW_READY,
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
        } catch (metaError) {
          console.warn('[releaseReview] Metadata update failed (non-critical):', metaError)
        }
      }

      return { [SUCCESS]: true, data: 'Review released successfully' }
    }

    const errorText = await response.text().catch(() => '')
    return {
      [SUCCESS]: false,
      [MESSAGE]: `Failed to release review: ${response.status} ${errorText}`,
    }
  } catch (error) {
    console.error('[releaseReview] Exception:', error)
    return {
      [SUCCESS]: false,
      [MESSAGE]: error instanceof Error ? error.message : 'An unknown error occurred',
    }
  }
}

/**
 * Unassigns the reviewer from a RAFT/DOI (without changing status).
 * Only publishers can unassign reviewers.
 *
 * @param doiId - The DOI identifier suffix (e.g., "RAFTS-7rtut-gkryn.test")
 * @returns Response with success/error information
 */
export const unassignReviewer = async (doiId: string): Promise<IResponseData<string>> => {
  try {
    const session = await auth()
    const accessToken = session?.accessToken

    if (!accessToken) {
      return { [SUCCESS]: false, [MESSAGE]: 'Not authenticated' }
    }

    const url = `${SUBMIT_DOI_URL}/${doiId}`

    // Send empty reviewer to unassign
    const formData = createDoiFormData({ nodeData: { reviewer: '' } })

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Cookie: `CADC_SSO=${accessToken}`,
      },
      body: formData,
      redirect: 'manual',
    })

    if (response.status === 303 || response.ok) {
      return { [SUCCESS]: true, data: 'Reviewer unassigned successfully' }
    }

    const errorText = await response.text().catch(() => '')
    return {
      [SUCCESS]: false,
      [MESSAGE]: `Failed to unassign reviewer: ${response.status} ${errorText}`,
    }
  } catch (error) {
    console.error('[unassignReviewer] Exception:', error)
    return {
      [SUCCESS]: false,
      [MESSAGE]: error instanceof Error ? error.message : 'An unknown error occurred',
    }
  }
}
