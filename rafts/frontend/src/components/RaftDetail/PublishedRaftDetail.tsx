'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { RaftData } from '@/types/doi'
import { Container, Paper, Box } from '@mui/material'

// Import modular components
import RaftBreadcrumbs from './components/RaftBreadcrumbs'
import RaftBackButton from './components/RaftBackButton'
import RaftHeader from './components/RaftHeader'
import RaftTabs from './components/RaftTabs'
import RelatedRafts from './components/RelatedRafts'
import DeleteConfirmationDialog from './components/DeleteConfirmationDialog'

// Import tab content components
import OverviewTab from './tabs/OverviewTab'
import TechnicalInfoTab from './tabs/TechnicalInfoTab'
import MeasurementsTab from './tabs/MeasurementsTab'
import AdditionalInfoTab from './tabs/AdditionalInfoTab'

interface RaftDetailProps {
  raftData: RaftData
}

export default function RaftDetail({ raftData }: RaftDetailProps) {
  const router = useRouter()
  const [tabValue, setTabValue] = useState(0)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  // Check if user can edit/delete based on status
  // Note: Backend uses 'in progress' for draft, frontend uses 'draft'
  const currentStatus = raftData.generalInfo?.status?.toLowerCase() ?? ''
  const isDraft = ['draft', 'in progress'].includes(currentStatus)
  const isEditable = isDraft || ['rejected'].includes(currentStatus)
  const isDeletable = isDraft

  // Handle tab changes
  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue)
  }

  // Handle download
  const handleDownload = () => {
    // Implement download logic here
  }

  // Handle share
  const handleShare = () => {
    const url = window.location.href
    navigator.clipboard.writeText(url)
    // You would normally show a toast notification here
  }

  // Handle edit
  const handleEdit = () => {
    router.push(`/form/edit/${raftData._id}`)
  }

  // Handle delete action
  const handleDelete = () => {
    setDeleteDialogOpen(true)
  }

  // Confirm delete action
  const confirmDelete = async () => {
    // Implement deletion logic with server action
    setDeleteDialogOpen(false)
    // After successful deletion, redirect to the list page
    router.push('/view/rafts')
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Breadcrumbs navigation */}
      <RaftBreadcrumbs title={raftData?.generalInfo?.title} basePath={'/public-view/rafts'} />

      {/* Back button */}
      <RaftBackButton onBack={() => router.back()} />

      {/* Main content */}
      <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden', mb: 4 }}>
        {/* Header section with title, metadata, and action buttons */}
        <RaftHeader
          raftData={raftData}
          isEditable={isEditable}
          isDeletable={isDeletable}
          onDownload={handleDownload}
          onShare={handleShare}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />

        {/* Tabs navigation */}
        <RaftTabs value={tabValue} onChange={handleTabChange} />

        {/* Tab content panels */}
        <Box>
          {tabValue === 0 && (
            <OverviewTab
              abstract={raftData.observationInfo?.abstract}
              authorInfo={raftData.authorInfo}
              acknowledgements={raftData.observationInfo?.acknowledgements}
            />
          )}

          {tabValue === 1 && (
            <TechnicalInfoTab technical={raftData.technical} doiId={raftData.id} />
          )}

          {tabValue === 2 && <MeasurementsTab measurementInfo={raftData.measurementInfo} />}

          {tabValue === 3 && <AdditionalInfoTab miscInfo={raftData.miscInfo} />}
        </Box>
      </Paper>

      {/* Related RAFTs section - if any */}
      {raftData.relatedRafts && raftData.relatedRafts.length > 0 && (
        <RelatedRafts relatedRafts={raftData.relatedRafts} />
      )}

      {/* Delete confirmation dialog */}
      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={confirmDelete}
      />
    </Container>
  )
}
