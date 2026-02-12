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

import { useEffect, useState } from 'react'
import { Alert, Button, Paper, Typography, CircularProgress, Box } from '@mui/material'
import { CheckCircle, XCircle } from 'lucide-react'
import { verifyEmail } from '@/actions/user/verifyEmail'
import Link from 'next/link'
import LoginFormLayout from '@/components/Layout/LoginFormLayout'

const VerifyEmailPage = ({ token }: { token: string }) => {
  const [verificationState, setVerificationState] = useState<{
    isLoading: boolean
    success: boolean | null
    message: string | null
  }>({
    isLoading: true,
    success: null,
    message: null,
  })

  useEffect(() => {
    const verify = async () => {
      if (!token) {
        setVerificationState({
          isLoading: false,
          success: false,
          message: 'Invalid verification link. Token is missing.',
        })
        return
      }

      try {
        const result = await verifyEmail(token)
        setVerificationState({
          isLoading: false,
          success: result.success,
          message: result.success ? result.message : result.error,
        })
      } catch {
        setVerificationState({
          isLoading: false,
          success: false,
          message: 'An error occurred during verification.',
        })
      }
    }

    verify()
  }, [token])

  return (
    <LoginFormLayout>
      <Paper elevation={3} className="p-8 w-full max-w-md mx-auto">
        <Typography variant="h5" component="h1" className="mb-6 text-center">
          Email Verification
        </Typography>

        {verificationState.isLoading ? (
          <Box className="flex flex-col items-center justify-center py-8">
            <CircularProgress size={48} className="mb-4" />
            <Typography>Verifying your email...</Typography>
          </Box>
        ) : verificationState.success ? (
          <Box className="flex flex-col items-center justify-center py-4">
            <CheckCircle size={64} className="text-green-500 mb-4" />
            <Alert severity="success" className="mb-4 w-full">
              {verificationState.message}
            </Alert>
            <Button
              component={Link}
              href="/login"
              variant="contained"
              color="primary"
              className="mt-4"
              fullWidth
            >
              Sign In
            </Button>
          </Box>
        ) : (
          <Box className="flex flex-col items-center justify-center py-4">
            <XCircle size={64} className="text-red-500 mb-4" />
            <Alert severity="error" className="mb-4 w-full">
              {verificationState.message}
            </Alert>
            <Button
              component={Link}
              href="/register"
              variant="outlined"
              color="primary"
              className="mt-4"
              fullWidth
            >
              Back to Registration
            </Button>
          </Box>
        )}
      </Paper>
    </LoginFormLayout>
  )
}

export default VerifyEmailPage
