'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { RaftData } from '@/types/doi'
import { RaftReview } from '@/types/reviews'

import { Container, Grid, Paper, Box, Alert } from '@mui/material'

// Import modular components
import RaftBreadcrumbs from './components/RaftBreadcrumbs'
import RaftBackButton from './components/RaftBackButton'
import RaftHeader from './components/RaftHeader'
import RaftTabs from './components/RaftTabs'
//import CommentSection from './components/CommentSection'
import ReviewerSidePanel from './components/ReviewerSidePanel'

// Import tab content components
import OverviewTab from './tabs/OverviewTab'
import TechnicalInfoTab from './tabs/TechnicalInfoTab'
import AdditionalInfoTab from './tabs/AdditionalInfoTab'

interface ReviewRaftDetailProps {
  raftData: Partial<RaftData> | undefined
  review?: RaftReview | undefined
  hasReview?: boolean
}

export default function ReviewRaftDetail({
  raftData,
  review,
  hasReview = false,
}: ReviewRaftDetailProps) {
  const router = useRouter()
  const [tabValue, setTabValue] = useState(0)
  const [actionMessage, setActionMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

  // Handle tab changes
  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue)
  }

  // Handle success/error notifications
  const handleNotification = (type: 'success' | 'error', text: string) => {
    setActionMessage({ type, text })
  }
  if (!raftData) {
    return null
  }
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Breadcrumbs navigation */}
      <RaftBreadcrumbs title={raftData?.generalInfo?.title} basePath="/review/rafts" />

      {/* Back button */}
      <RaftBackButton onBack={() => router.push('/review/rafts')} />

      {/* Action result message */}
      {actionMessage && (
        <Alert severity={actionMessage.type} onClose={() => setActionMessage(null)} sx={{ mb: 2 }}>
          {actionMessage.text}
        </Alert>
      )}

      {/* Main content with reviewer sidebar */}
      <Grid container spacing={3}>
        {/* Main RAFT content */}
        <Grid size={{ xs: 12, md: 8 }}>
          {/* Review section */}
          {/*
          {hasReview && <CommentSection review={review} onNotify={handleNotification} />}
*/}

          {/* RAFT content */}
          <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden', mb: 4 }}>
            {/* Header section with title and metadata */}
            <RaftHeader raftData={raftData} isEditable={false} isDeletable={false} />

            {/* Tabs navigation */}
            <RaftTabs value={tabValue} onChange={handleTabChange} />

            {/* Tab content panels */}
            <Box>
              {tabValue === 0 && (
                <OverviewTab
                  objectName={raftData.observationInfo?.objectName}
                  relatedPublishedRafts={raftData.observationInfo?.relatedPublishedRafts}
                  abstract={raftData.observationInfo?.abstract}
                  figure={raftData.observationInfo?.figure}
                  authorInfo={raftData.authorInfo}
                  acknowledgements={raftData.observationInfo?.acknowledgements}
                  doiId={raftData.id}
                  dataDirectory={raftData.dataDirectory}
                />
              )}

              {tabValue === 1 && (
                <TechnicalInfoTab technical={raftData.technical} doiId={raftData.id} />
              )}

              {tabValue === 2 && <AdditionalInfoTab miscInfo={raftData.miscInfo} />}
            </Box>
          </Paper>
        </Grid>

        {/* Reviewer sidebar */}
        <Grid size={{ xs: 12, md: 4 }}>
          <ReviewerSidePanel
            raftData={raftData}
            review={review}
            hasReview={hasReview}
            onNotify={handleNotification}
          />
        </Grid>
      </Grid>
    </Container>
  )
}
