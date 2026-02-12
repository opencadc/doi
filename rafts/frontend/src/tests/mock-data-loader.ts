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

import { RaftData } from '@/types/doi'
import { TRaftStatus } from '@/shared/model'
import mockReviewData from './mock-review-data.json'
import detailedRaftData from './raft-2025-07-23.json'

// In-memory storage for mock data modifications
let mockDataStore: RaftData[] | null = null

/**
 * Initialize or get the mock data store
 */
function getMockDataStore(): RaftData[] {
  if (!mockDataStore) {
    mockDataStore = JSON.parse(JSON.stringify(mockReviewData.rafts)) as RaftData[]
  }
  return mockDataStore
}

/**
 * Load mock RAFT data for development/testing
 * @param status - Filter by status (optional)
 * @returns Array of mock RAFT data
 */
export function loadMockRaftData(status?: string): RaftData[] {
  const allRafts = getMockDataStore()

  if (!status) {
    return allRafts
  }

  return allRafts.filter((raft) => raft.generalInfo.status === status)
}

/**
 * Get count of RAFTs by status
 * @returns Object with status counts
 */
export function getMockRaftCounts(): Record<string, number> {
  const allRafts = getMockDataStore()
  const counts: Record<string, number> = {}

  allRafts.forEach((raft) => {
    const status = raft.generalInfo.status
    counts[status] = (counts[status] || 0) + 1
  })

  return counts
}

/**
 * Get a single mock RAFT by ID
 * @param id - The RAFT ID
 * @returns Single RAFT data or null
 */
export function getMockRaftById(id: string): RaftData | null {
  // Always return the detailed RAFT data for any valid ID from the mock review data
  const allRafts = getMockDataStore()
  const raftExists = allRafts.find((raft) => raft._id === id || raft.id === id)

  if (raftExists) {
    // Return the detailed RAFT data but preserve the ID and status from the original
    const detailedRaft = detailedRaftData as RaftData
    return {
      ...detailedRaft,
      _id: raftExists._id,
      id: raftExists.id,
      generalInfo: {
        ...detailedRaft.generalInfo,
        status: raftExists.generalInfo.status,
        title: raftExists.generalInfo.title, // Keep the original title for consistency
      },
      createdAt: raftExists.createdAt,
      updatedAt: raftExists.updatedAt,
    }
  }

  return null
}

/**
 * Update the status of a mock RAFT
 * @param id - The RAFT ID
 * @param newStatus - The new status to set
 * @returns Success status and updated RAFT data
 */
export function updateMockRaftStatus(
  id: string,
  newStatus: string,
): { success: boolean; data?: RaftData; error?: string } {
  const allRafts = getMockDataStore()
  const raftIndex = allRafts.findIndex((raft) => raft._id === id || raft.id === id)

  if (raftIndex === -1) {
    return { success: false, error: 'RAFT not found' }
  }

  // Update the status
  allRafts[raftIndex].generalInfo.status = newStatus as TRaftStatus
  allRafts[raftIndex].updatedAt = new Date().toISOString()

  // Return the detailed RAFT with updated status
  const updatedRaft = getMockRaftById(id)
  return { success: true, data: updatedRaft || allRafts[raftIndex] }
}

/**
 * Reset mock data to original state
 */
export function resetMockData(): void {
  mockDataStore = null
}
