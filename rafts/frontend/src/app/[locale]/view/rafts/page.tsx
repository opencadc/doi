'use client'
import { useState, useEffect, useCallback } from 'react'
import { getDOIData } from '@/actions/getDOI'
import RaftTable from '@/components/DOIRaftTable/RaftTable'
import { DOIData } from '@/types/doi'
import { signOut } from 'next-auth/react'
import { AUTH_FAILED } from '@/auth/cadc-auth/constants'
import { Link } from '@/i18n/routing'
import { Button } from '@mui/material'
import { Add } from '@mui/icons-material'

export default function View() {
  const [doiData, setDoiData] = useState<DOIData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    const { success, data, error } = await getDOIData()
    if (success && data) {
      setDoiData(data)
    } else {
      if (error === AUTH_FAILED) {
        await signOut()
      }
      console.error('Error fetching DOI data:', error)
      setError('Failed to load RAFT data. Please try again later.')
    }
    setIsLoading(false)
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Callback to refresh data after status changes
  const handleRefresh = useCallback(() => {
    fetchData()
  }, [fetchData])

  return (
    <div className="grid grid-rows-[auto_1fr_auto] items-center min-h-screen p-4 pb-8 gap-8 sm:p-8 font-[family-name:var(--font-geist-sans)]">
      <header className="row-start-1 w-full">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Your submissions (RAFTs)</h1>
          <Link href="/form/create">
            <Button variant="contained" color="primary" startIcon={<Add />} size="medium">
              Create New Raft
            </Button>
          </Link>
        </div>
      </header>
      <main className="row-start-2 w-full max-w-7xl mx-auto">
        {error ? (
          <div className="text-red-500 p-4 border border-red-300 rounded bg-red-50">{error}</div>
        ) : (
          <RaftTable data={doiData} onRefresh={handleRefresh} isLoading={isLoading} />
        )}
      </main>
      <footer className="row-start-3 w-full text-center text-sm text-gray-500 mt-8">
        <div>CADC RAFT Publication System</div>
      </footer>
    </div>
  )
}
