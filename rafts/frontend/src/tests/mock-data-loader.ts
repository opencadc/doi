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
