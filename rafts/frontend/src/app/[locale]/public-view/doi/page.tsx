'use client'
import { useState, useEffect } from 'react'
import { getDOIData } from '@/actions/getDOI'
import RaftTable from '@/components/DOIRaftTable/RaftTable'
import { DOIData } from '@/types/doi'
import { getRafts } from '@/actions/getRafts'

export default function View() {
  const [doiData, setDoiData] = useState<DOIData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      const { success, data, error } = await getDOIData()
      if (success && data) {
        setDoiData(data)
      } else {
        console.error('Error fetching DOI data:', error)
        setError('Failed to load RAFT data. Please try again later.')
      }
      setIsLoading(false)
    }

    fetchData()
  }, [])

  useEffect(() => {
    const fetchRafts = async () => {
      setIsLoading(true)
      const { success, data, error } = await getRafts()
      if (success && data) {
        // Data fetched successfully
      } else {
        console.error('Error fetching DOI data:', error)
        setError('Failed to load RAFT data. Please try again later.')
      }
      setIsLoading(false)
    }

    fetchRafts()
  }, [])

  return (
    <div className="grid grid-rows-[auto_1fr_auto] items-center min-h-screen p-4 pb-8 gap-8 sm:p-8 font-[family-name:var(--font-geist-sans)]">
      <header className="row-start-1 w-full">
        <h1 className="text-2xl font-bold mb-4">Your submissions (RAFTs)</h1>
      </header>
      <main className="row-start-2 w-full max-w-7xl mx-auto">
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <span>Loading RAFT data...</span>
          </div>
        ) : error ? (
          <div className="text-red-500 p-4 border border-red-300 rounded bg-red-50">{error}</div>
        ) : (
          <RaftTable data={doiData} />
        )}
      </main>
      <footer className="row-start-3 w-full text-center text-sm text-gray-500 mt-8">
        <div>CADC RAFT Publication System</div>
      </footer>
    </div>
  )
}
