#!/usr/bin/env ts-node

import {
  loadMockRaftData,
  getMockRaftCounts,
  updateMockRaftStatus,
  getMockRaftById,
} from '../src/tests/mock-data-loader'

console.log('Testing Mock Data System\n')

// Test 1: Load all RAFTs
console.log('1. Loading all RAFTs:')
const allRafts = loadMockRaftData()
console.log(`   Total RAFTs: ${allRafts.length}`)

// Test 2: Get counts by status
console.log('\n2. RAFT counts by status:')
const counts = getMockRaftCounts()
Object.entries(counts).forEach(([status, count]) => {
  console.log(`   ${status}: ${count}`)
})

// Test 3: Load RAFTs by status
console.log('\n3. Loading RAFTs by status:')
const reviewReadyRafts = loadMockRaftData('review_ready')
console.log(`   review_ready: ${reviewReadyRafts.length} RAFTs`)
console.log(`   - ${reviewReadyRafts[0]?.generalInfo.title}`)

// Test 4: Update RAFT status
console.log('\n4. Testing status update:')
const raftToUpdate = reviewReadyRafts[0]
if (raftToUpdate) {
  console.log(`   Before: ${raftToUpdate._id} - Status: ${raftToUpdate.generalInfo.status}`)

  const updateResult = updateMockRaftStatus(raftToUpdate._id, 'under_review')
  if (updateResult.success && updateResult.data) {
    console.log(
      `   After: ${updateResult.data._id} - Status: ${updateResult.data.generalInfo.status}`,
    )
  }

  // Verify the change persists
  const updatedRaft = getMockRaftById(raftToUpdate._id)
  console.log(`   Verified: ${updatedRaft?.generalInfo.status}`)
}

// Test 5: Check new counts after update
console.log('\n5. New counts after status update:')
const newCounts = getMockRaftCounts()
Object.entries(newCounts).forEach(([status, count]) => {
  console.log(`   ${status}: ${count}`)
})

console.log('\n✅ Mock data system test complete!')
