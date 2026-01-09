'use client'
import { useState, useEffect } from 'react'
import RaftTable from '@/components/RaftTable/ReviewRaftTable'
import { RaftData } from '@/types/doi'
import { getDOIsForReview } from '@/actions/getDOIsForReview'
import { OPTION_REVIEW } from '@/shared/constants'
import { Typography, Paper } from '@mui/material'
import StatusFilter from '@/components/RaftDetail/components/StatusFilter'

export default function ReviewRafts() {
  const [raftData, setRaftData] = useState<RaftData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentStatus, setCurrentStatus] = useState<string>(OPTION_REVIEW)
  const [counts, setCounts] = useState<Record<string, number>>({})

  const fetchData = async (status: string) => {
    setIsLoading(true)
    setError(null)

    const { success, data, error } = await getDOIsForReview(status)

    if (success && data) {
      setRaftData(data.data || [])
      // Update counts from the response
      setCounts(data.counts || {})
    } else {
      console.error('Error fetching RAFT data:', error)
      setError('Failed to load RAFT data. Please try again later.')
      setRaftData([])
    }

    setIsLoading(false)
  }

  // Initial data load
  useEffect(() => {
    fetchData(currentStatus)
  }, [currentStatus])

  const handleStatusChange = (status: string) => {
    setCurrentStatus(status)
    fetchData(status)
  }

  return (
    <div className="grid grid-rows-[auto_1fr_auto] items-center min-h-screen p-4 pb-8 gap-8 sm:p-8">
      <header className="row-start-1 w-full">
        <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
          Review RAFT Submissions
        </Typography>
        <Typography variant="body1" color="text.secondary" gutterBottom>
          Manage and review RAFT submissions based on their current status.
        </Typography>

        <StatusFilter
          currentStatus={currentStatus}
          counts={counts}
          onStatusChange={handleStatusChange}
        />
      </header>
      <main className="row-start-2 w-full max-w-7xl mx-auto">
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <span>Loading RAFTs...</span>
          </div>
        ) : error ? (
          <div className="text-red-500 p-4 border border-red-300 rounded bg-red-50">{error}</div>
        ) : raftData.length === 0 ? (
          <Paper elevation={1} sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary">
              No submissions found with this status
            </Typography>
          </Paper>
        ) : (
          <RaftTable
            data={raftData}
            isReviewMode={true}
            currentStatus={currentStatus}
            onStatusUpdate={() => fetchData(currentStatus)}
          />
        )}
      </main>

      <footer className="row-start-3 w-full text-center text-sm text-gray-500 mt-8">
        <div>CADC RAFT Publication System</div>
      </footer>
    </div>
  )
}
