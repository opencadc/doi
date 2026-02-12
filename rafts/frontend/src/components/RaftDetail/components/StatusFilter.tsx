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

import React from 'react'
import { Paper, Box, Typography, ButtonGroup, Button, Chip } from '@mui/material'
import {
  OPTION_REVIEW,
  OPTION_UNDER_REVIEW,
  OPTION_APPROVED,
  OPTION_REJECTED,
} from '@/shared/constants'
import { useTranslations } from 'next-intl'

interface StatusFilterProps {
  currentStatus: string
  counts: Record<string, number>
  onStatusChange: (status: string) => void
}

const StatusFilter: React.FC<StatusFilterProps> = ({ currentStatus, counts, onStatusChange }) => {
  const t = useTranslations('review_page')

  // Map status to display name
  const getStatusDisplayName = (status: string): string => {
    return t(`status_${status}`)
  }

  // Map status to button color
  const getButtonColor = (status: string) => {
    if (status === currentStatus) {
      return 'primary'
    }
    return 'inherit'
  }

  const statusOptions = [OPTION_REVIEW, OPTION_UNDER_REVIEW, OPTION_APPROVED, OPTION_REJECTED]

  return (
    <Paper elevation={2} className="p-4 mb-6">
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle1" gutterBottom>
          {t('filter_by_status')}
        </Typography>
        <ButtonGroup variant="outlined" sx={{ mb: 2 }}>
          {statusOptions.map((status) => (
            <Button
              key={status}
              onClick={() => onStatusChange(status)}
              color={getButtonColor(status)}
              variant={currentStatus === status ? 'contained' : 'outlined'}
              sx={{ textTransform: 'none' }}
            >
              {getStatusDisplayName(status)}
              {counts[status] > 0 && (
                <Chip
                  label={counts[status]}
                  size="small"
                  color={currentStatus === status ? 'secondary' : 'default'}
                  sx={{ ml: 1, height: 20 }}
                />
              )}
            </Button>
          ))}
        </ButtonGroup>
      </Box>

      <Typography variant="h6">
        {getStatusDisplayName(currentStatus)}
        <Chip
          label={counts[currentStatus] || 0}
          color="primary"
          size="small"
          sx={{ ml: 1, verticalAlign: 'middle' }}
        />
      </Typography>
    </Paper>
  )
}

export default StatusFilter
