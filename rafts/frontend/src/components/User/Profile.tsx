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

import { Paper, Typography, Box, Avatar, Divider, Chip, Grid } from '@mui/material'
import { User, Building, Mail, IdCard, UserCog } from 'lucide-react'
import { useTranslations } from 'next-intl'

interface UserProfileProps {
  user: {
    name?: string
    email?: string
    userId?: string
    role?: string
    affiliation?: string
  }
}

const UserProfile = ({ user }: UserProfileProps) => {
  const t = useTranslations('profile')

  return (
    <Paper elevation={3} className="p-6">
      <Box className="flex flex-col md:flex-row gap-6 items-center mb-6">
        <Avatar
          sx={{
            width: 100,
            height: 100,
            bgcolor: 'primary.main',
            fontSize: '2.5rem',
          }}
        >
          {user.name
            ?.split(' ')
            ?.map((n) => n[0])
            .join('')}
        </Avatar>

        <Box className="flex-1 text-center md:text-left">
          <Typography variant="h4" component="h1" gutterBottom>
            {user.name}
          </Typography>

          <Box className="flex flex-wrap justify-center md:justify-start gap-2 mt-2">
            <Chip label={user.role} color="primary" size="small" icon={<UserCog size={16} />} />
          </Box>
        </Box>
      </Box>

      <Divider className="my-4" />

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Box className="flex items-center gap-2 mb-3">
            <Mail size={20} />
            <Typography variant="subtitle1" fontWeight="medium">
              {t('email')}:
            </Typography>
          </Box>
          <Typography variant="body1">{user.email}</Typography>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Box className="flex items-center gap-2 mb-3">
            <Building size={20} />
            <Typography variant="subtitle1" fontWeight="medium">
              {t('affiliation')}:
            </Typography>
          </Box>
          <Typography variant="body1">{user.affiliation}</Typography>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Box className="flex items-center gap-2 mb-3">
            <IdCard size={20} />
            <Typography variant="subtitle1" fontWeight="medium">
              {t('user_id')}:
            </Typography>
          </Box>
          <Typography variant="body1" className="font-mono text-sm">
            {user.userId}
          </Typography>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Box className="flex items-center gap-2 mb-3">
            <User size={20} />
            <Typography variant="subtitle1" fontWeight="medium">
              {t('role')}:
            </Typography>
          </Box>
          <Typography variant="body1" className="capitalize">
            {user.role}
          </Typography>
        </Grid>
      </Grid>
    </Paper>
  )
}

export default UserProfile
