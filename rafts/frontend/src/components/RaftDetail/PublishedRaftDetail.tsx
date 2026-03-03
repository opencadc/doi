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
