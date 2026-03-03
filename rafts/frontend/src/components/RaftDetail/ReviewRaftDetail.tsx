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
import dynamic from 'next/dynamic'
import { RaftData } from '@/types/doi'
import { RaftReview } from '@/types/reviews'

import { Container, Grid, Paper, Box, Alert } from '@mui/material'

// Import modular components
import RaftBreadcrumbs from './components/RaftBreadcrumbs'
import RaftBackButton from './components/RaftBackButton'
import RaftHeader from './components/RaftHeader'
import RaftTabs from './components/RaftTabs'

// Lazy-load reviewer panel (only for reviewers)
const ReviewerSidePanel = dynamic(() => import('./components/ReviewerSidePanel'))

// Tab content: only one is visible at a time
import OverviewTab from './tabs/OverviewTab'
const TechnicalInfoTab = dynamic(() => import('./tabs/TechnicalInfoTab'))
const AdditionalInfoTab = dynamic(() => import('./tabs/AdditionalInfoTab'))

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

              {tabValue === 2 && (
                <AdditionalInfoTab miscInfo={raftData.miscInfo} doiId={raftData.id} />
              )}
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
