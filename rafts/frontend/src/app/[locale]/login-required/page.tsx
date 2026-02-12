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

import { useSearchParams } from 'next/navigation'
import { useRouter } from '@/i18n/routing'
import { Box, Container, Paper, Typography, Button, Divider } from '@mui/material'
import { LogIn, Home, Eye, FileText } from 'lucide-react'
import { useTranslations } from 'next-intl'

export default function LoginRequiredPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const t = useTranslations('auth')
  const returnUrl = searchParams.get('returnUrl') || '/'

  const handleLogin = () => {
    router.push(`/login?returnUrl=${encodeURIComponent(returnUrl)}`)
  }

  const handleHome = () => {
    router.push('/')
  }

  const handlePublicRafts = () => {
    router.push('/public-view/rafts')
  }

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Paper elevation={3} sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
        <Box sx={{ mb: 3 }}>
          <LogIn size={64} strokeWidth={1.5} color="#1976d2" />
        </Box>

        <Typography variant="h4" gutterBottom>
          {t('login_required_title')}
        </Typography>

        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          {t('login_required_message')}
        </Typography>

        <Button
          variant="contained"
          color="primary"
          size="large"
          startIcon={<LogIn size={20} />}
          onClick={handleLogin}
          fullWidth
          sx={{ mb: 2 }}
        >
          {t('sign_in')}
        </Button>

        <Divider sx={{ my: 3 }}>
          <Typography variant="body2" color="text.secondary">
            {t('or_browse')}
          </Typography>
        </Divider>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {t('explore_without_login')}
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, flexDirection: 'column' }}>
          <Button variant="outlined" startIcon={<Home size={18} />} onClick={handleHome} fullWidth>
            {t('go_home')}
          </Button>

          <Button
            variant="outlined"
            startIcon={<Eye size={18} />}
            onClick={handlePublicRafts}
            fullWidth
          >
            {t('browse_public_rafts')}
          </Button>
        </Box>

        <Box sx={{ mt: 4, pt: 3, borderTop: '1px solid', borderColor: 'divider' }}>
          <Typography variant="caption" color="text.secondary">
            <FileText size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
            {t('requested_page')}: <code>{returnUrl}</code>
          </Typography>
        </Box>
      </Paper>
    </Container>
  )
}
