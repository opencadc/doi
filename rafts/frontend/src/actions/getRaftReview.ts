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
import { RaftReview } from '@/types/reviews'
import { useMockData } from '@/config/environment'
import { getMockRaftById } from '@/tests/mock-data-loader'

export const getRaftReview = async (raftId: string) => {
  try {
    // Use mock data if enabled
    if (useMockData) {
      const mockRaft = getMockRaftById(raftId)

      if (!mockRaft) {
        return { success: false, error: 'RAFT not found' }
      }

      // Create a mock review based on the RAFT status
      const mockReview: RaftReview = {
        _id: `review-${raftId}`,
        raftId: raftId,
        currentVersion: 1,
        versions: [
          {
            versionNumber: 1,
            raftData: mockRaft,
            createdAt: mockRaft.createdAt,
            createdBy: {
              _id: 'mock-user-1',
              firstName: 'Mock',
              lastName: 'User',
            },
            commitMessage: 'Initial submission',
            _id: `version-${raftId}-1`,
          },
        ],
        statusHistory:
          mockRaft.generalInfo.status !== 'review_ready'
            ? [
                {
                  fromStatus: 'review_ready',
                  toStatus: mockRaft.generalInfo.status,
                  changedBy: {
                    _id: 'mock-reviewer-1',
                    firstName: 'Mock',
                    lastName: 'Reviewer',
                  },
                  changedAt: mockRaft.updatedAt,
                  reason: `Status changed to ${mockRaft.generalInfo.status}`,
                  _id: `status-change-${raftId}-1`,
                },
              ]
            : [],
        comments:
          mockRaft.generalInfo.status === 'rejected'
            ? [
                {
                  _id: `comment-${raftId}-1`,
                  content: 'This submission needs more data to support the findings.',
                  createdBy: {
                    _id: 'mock-reviewer-1',
                    firstName: 'Mock',
                    lastName: 'Reviewer',
                  },
                  createdAt: mockRaft.updatedAt,
                  isResolved: false,
                },
              ]
            : [],
        assignedReviewers: [
          {
            _id: 'mock-reviewer-1',
            firstName: 'Mock',
            lastName: 'Reviewer',
          },
        ],
        isActive:
          mockRaft.generalInfo.status !== 'approved' && mockRaft.generalInfo.status !== 'rejected',
        createdAt: mockRaft.createdAt,
        updatedAt: mockRaft.updatedAt,
      }

      return { success: true, data: mockReview }
    }

    // Get the session with the access token
    const session = await auth()
    const accessToken = session?.accessToken

    if (!accessToken) {
      return { success: false, error: 'Not authenticated' }
    }

    // Make the API call with the access token as a Bearer token
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/reviews/by-raft/${raftId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      },
    )

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error(`Failed to fetch reviews for RAFT ${raftId}:`, errorData)
      return {
        success: false,
        error: errorData.message || `Request failed with status ${response.status}`,
      }
    }

    const responseData = await response.json()
    const data: RaftReview = responseData.data

    return { success: true, data }
  } catch (error) {
    console.error(`Error fetching reviews for RAFT ${raftId}:`, error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unknown error occurred',
    }
  }
}
