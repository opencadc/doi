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

'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { RaftData } from '@/types/doi'
import { Container, Paper, Box, Snackbar, Alert } from '@mui/material'

// Import modular components
import RaftBreadcrumbs from './components/RaftBreadcrumbs'
import RaftBackButton from './components/RaftBackButton'
import RaftHeader from './components/RaftHeader'
import RaftTabs from './components/RaftTabs'
import RelatedRafts from './components/RelatedRafts'

// Lazy-load components that are conditionally rendered
const DeleteConfirmationDialog = dynamic(() => import('./components/DeleteConfirmationDialog'))

// Tab content: only one is visible at a time
import OverviewTab from './tabs/OverviewTab'
const TechnicalInfoTab = dynamic(() => import('./tabs/TechnicalInfoTab'))
const AdditionalInfoTab = dynamic(() => import('./tabs/AdditionalInfoTab'))

// Import server actions
import { submitForReview, revertToDraft } from '@/actions/submitForReview'
import { updateDOIStatus } from '@/actions/updateDOIStatus'
import { deleteRaft } from '@/actions/deleteRaft'
import { BACKEND_STATUS } from '@/shared/backendStatus'

interface RaftDetailProps {
  raftData: Partial<RaftData>
}

export default function RaftDetail({ raftData }: RaftDetailProps) {
  const router = useRouter()
  const [tabValue, setTabValue] = useState(0)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [activeAction, setActiveAction] = useState<'submitting' | 'reverting' | 'deleting' | null>(
    null,
  )
  const [snackbar, setSnackbar] = useState<{
    open: boolean
    message: string
    severity: 'success' | 'error'
  }>({ open: false, message: '', severity: 'success' })

  if (!raftData) {
    return null
  }

  // Check if user can edit/delete based on status
  const currentStatus = raftData?.generalInfo?.status?.toLowerCase() ?? ''
  const isDraft = currentStatus === BACKEND_STATUS.IN_PROGRESS || currentStatus === 'draft'
  const isRejected = currentStatus === BACKEND_STATUS.REJECTED
  const isEditable = isDraft || isRejected
  const isReviewReady = currentStatus === BACKEND_STATUS.REVIEW_READY
  const isDeletable = isDraft
  const canSubmitForReview = isDraft
  const canRevertToDraft = isReviewReady

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
  const handleEdit = async () => {
    // If the RAFT is rejected, change status to "in progress" (draft) before editing
    if (isRejected && raftData.id) {
      try {
        const result = await updateDOIStatus(raftData.id, BACKEND_STATUS.IN_PROGRESS, {
          dataDirectory: raftData.dataDirectory,
          previousStatus: raftData.generalInfo?.status,
        })
        if (!result.success) {
          console.error('[RaftDetail] Failed to update status:', result.message)
          setSnackbar({
            open: true,
            message: result.message || 'Failed to revert to draft',
            severity: 'error',
          })
          return
        }
        setSnackbar({
          open: true,
          message: 'RAFT status changed to Draft.',
          severity: 'success',
        })
      } catch (error) {
        console.error('[RaftDetail] Error updating status:', error)
        setSnackbar({
          open: true,
          message: 'An error occurred while updating status',
          severity: 'error',
        })
        return
      }
    }

    router.push(`/form/edit/${raftData.id}`)
  }

  // Handle delete action
  const handleDelete = () => {
    setDeleteDialogOpen(true)
  }

  // Confirm delete action
  const confirmDelete = async () => {
    if (!raftData.id) {
      setSnackbar({
        open: true,
        message: 'No RAFT ID available',
        severity: 'error',
      })
      setDeleteDialogOpen(false)
      return
    }

    setActiveAction('deleting')
    try {
      const result = await deleteRaft(raftData.id)
      if (result.success) {
        setSnackbar({
          open: true,
          message: 'RAFT deleted successfully',
          severity: 'success',
        })
        setDeleteDialogOpen(false)
        setTimeout(() => {
          router.push('/view/rafts')
        }, 1500)
      } else {
        setSnackbar({
          open: true,
          message: result.message || 'Failed to delete RAFT',
          severity: 'error',
        })
        setDeleteDialogOpen(false)
      }
    } catch (error) {
      console.error('[RaftDetail] Error deleting RAFT:', error)
      setSnackbar({
        open: true,
        message: 'An error occurred while deleting RAFT',
        severity: 'error',
      })
      setDeleteDialogOpen(false)
    } finally {
      setActiveAction(null)
    }
  }

  // Handle submit for review
  const handleSubmitForReview = async () => {
    if (!raftData.id) {
      setSnackbar({
        open: true,
        message: 'No DOI ID available',
        severity: 'error',
      })
      return
    }

    setActiveAction('submitting')
    try {
      const result = await submitForReview(raftData.id, raftData.dataDirectory)
      if (result.success) {
        setSnackbar({
          open: true,
          message: 'RAFT status changed to Review Ready.',
          severity: 'success',
        })
        // Refresh the page to reflect the new status
        router.refresh()
      } else {
        setSnackbar({
          open: true,
          message: result.message || 'Failed to submit for review',
          severity: 'error',
        })
      }
    } catch (error) {
      console.error('[RaftDetail] Error submitting for review:', error)
      setSnackbar({
        open: true,
        message: 'An error occurred while submitting for review',
        severity: 'error',
      })
    } finally {
      setActiveAction(null)
    }
  }

  // Handle revert to draft
  const handleRevertToDraft = async () => {
    if (!raftData.id) {
      setSnackbar({
        open: true,
        message: 'No DOI ID available',
        severity: 'error',
      })
      return
    }

    setActiveAction('reverting')
    try {
      const result = await revertToDraft(
        raftData.id,
        raftData.dataDirectory,
        raftData.generalInfo?.status,
      )
      if (result.success) {
        setSnackbar({
          open: true,
          message: 'RAFT status changed to Draft.',
          severity: 'success',
        })
        router.refresh()
      } else {
        setSnackbar({
          open: true,
          message: result.message || 'Failed to revert to draft',
          severity: 'error',
        })
      }
    } catch (error) {
      console.error('[RaftDetail] Error reverting to draft:', error)
      setSnackbar({
        open: true,
        message: 'An error occurred while reverting to draft',
        severity: 'error',
      })
    } finally {
      setActiveAction(null)
    }
  }

  // Handle snackbar close
  const handleSnackbarClose = () => {
    setSnackbar((prev) => ({ ...prev, open: false }))
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Breadcrumbs navigation */}
      <RaftBreadcrumbs title={raftData?.generalInfo?.title} />

      {/* Back button */}
      <RaftBackButton onBack={() => router.back()} />

      {/* Main content */}
      <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden', mb: 4 }}>
        {/* Header section with title, metadata, and action buttons */}
        <RaftHeader
          raftData={raftData}
          isEditable={isEditable}
          isDeletable={isDeletable}
          canSubmitForReview={canSubmitForReview}
          isSubmittingForReview={activeAction === 'submitting'}
          canRevertToDraft={canRevertToDraft}
          isRevertingToDraft={activeAction === 'reverting'}
          onDownload={handleDownload}
          onShare={handleShare}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onSubmitForReview={handleSubmitForReview}
          onRevertToDraft={handleRevertToDraft}
        />

        {/* Tabs navigation */}
        <RaftTabs value={tabValue} onChange={handleTabChange} />

        {/* Tab content panels */}
        <Box>
          {tabValue === 0 && (
            <OverviewTab
              objectName={raftData.observationInfo?.objectName}
              relatedPublishedRafts={raftData.observationInfo?.relatedPublishedRafts}
              abstract={raftData.observationInfo?.abstract}
              authorInfo={raftData.authorInfo}
              acknowledgements={raftData.observationInfo?.acknowledgements}
              figure={raftData.observationInfo?.figure}
              doiId={raftData.id}
              dataDirectory={raftData.dataDirectory}
            />
          )}

          {tabValue === 1 && (
            <TechnicalInfoTab technical={raftData.technical} doiId={raftData.id} />
          )}

          {tabValue === 2 && <AdditionalInfoTab miscInfo={raftData.miscInfo} doiId={raftData.id} />}
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
        isDeleting={activeAction === 'deleting'}
      />

      {/* Snackbar for feedback */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  )
}
