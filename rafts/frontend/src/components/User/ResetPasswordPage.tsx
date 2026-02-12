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

// src/components/User/ResetPasswordPage.tsx
'use client'

import { useState } from 'react'
import { Alert, Button, Paper, Typography, CircularProgress, Box, TextField } from '@mui/material'
import { CheckCircle, XCircle, Eye, EyeOff } from 'lucide-react'
import { resetPassword } from '@/actions/user/resetPassword'
import Link from 'next/link'
import LoginFormLayout from '@/components/Layout/LoginFormLayout'
import { useForm } from 'react-hook-form'

interface ResetPasswordFormValues {
  newPassword: string
  confirmPassword: string
}

const ResetPasswordPage = ({ token }: { token: string }) => {
  const [resetState, setResetState] = useState<{
    isLoading: boolean
    success: boolean | null
    message: string | null
  }>({
    isLoading: false,
    success: null,
    message: null,
  })

  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResetPasswordFormValues>({
    defaultValues: {
      newPassword: '',
      confirmPassword: '',
    },
  })

  const passwordValue = watch('newPassword')

  const onSubmit = async (data: ResetPasswordFormValues) => {
    if (!token) {
      setResetState({
        isLoading: false,
        success: false,
        message: 'Invalid reset link. Token is missing.',
      })
      return
    }

    setResetState({
      ...resetState,
      isLoading: true,
    })

    try {
      const result = await resetPassword({
        token,
        newPassword: data.newPassword,
      })

      setResetState({
        isLoading: false,
        success: result.success,
        message: result.success ? result.message : result.error,
      })
    } catch (error) {
      console.error(error)
      setResetState({
        isLoading: false,
        success: false,
        message: 'An error occurred during password reset.',
      })
    }
  }

  if (!token) {
    return (
      <LoginFormLayout>
        <Paper elevation={3} className="p-8 w-full max-w-md mx-auto">
          <Typography variant="h5" component="h1" className="mb-6 text-center">
            Reset Password
          </Typography>
          <Box className="flex flex-col items-center justify-center py-4">
            <XCircle size={64} className="text-red-500 mb-4" />
            <Alert severity="error" className="mb-4 w-full">
              Invalid reset link. Token is missing.
            </Alert>
            <Button
              component={Link}
              href="/reset-password/request"
              variant="outlined"
              color="primary"
              className="mt-4"
              fullWidth
            >
              Request New Reset Link
            </Button>
          </Box>
        </Paper>
      </LoginFormLayout>
    )
  }

  return (
    <LoginFormLayout>
      <Paper elevation={3} className="p-8 w-full max-w-md mx-auto">
        <Typography variant="h5" component="h1" className="mb-6 text-center">
          Reset Password
        </Typography>

        {resetState.isLoading ? (
          <Box className="flex flex-col items-center justify-center py-8">
            <CircularProgress size={48} className="mb-4" />
            <Typography>Resetting your password...</Typography>
          </Box>
        ) : resetState.success ? (
          <Box className="flex flex-col items-center justify-center py-4">
            <CheckCircle size={64} className="text-green-500 mb-4" />
            <Alert severity="success" className="mb-4 w-full">
              {resetState.message}
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
        ) : resetState.success === false ? (
          <Box className="flex flex-col items-center justify-center py-4">
            <XCircle size={64} className="text-red-500 mb-4" />
            <Alert severity="error" className="mb-4 w-full">
              {resetState.message}
            </Alert>
            <Button
              component={Link}
              href="/reset-password/request"
              variant="outlined"
              color="primary"
              className="mt-4"
              fullWidth
            >
              Request New Reset Link
            </Button>
          </Box>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <TextField
              label="New Password"
              type={showPassword ? 'text' : 'password'}
              {...register('newPassword', {
                required: 'New password is required',
                minLength: {
                  value: 8,
                  message: 'Password must be at least 8 characters long',
                },
              })}
              error={!!errors.newPassword}
              helperText={errors.newPassword?.message || ' '}
              fullWidth
              slotProps={{
                input: {
                  endAdornment: (
                    <Button
                      onClick={() => setShowPassword(!showPassword)}
                      variant="text"
                      sx={{ minWidth: '40px', padding: '5px' }}
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </Button>
                  ),
                },
              }}
            />

            <TextField
              label="Confirm Password"
              type={showPassword ? 'text' : 'password'}
              {...register('confirmPassword', {
                required: 'Please confirm your password',
                validate: (value) => value === passwordValue || 'Passwords do not match',
              })}
              error={!!errors.confirmPassword}
              helperText={errors.confirmPassword?.message || ' '}
              fullWidth
            />

            <Button
              type="submit"
              variant="contained"
              color="primary"
              className="mt-4"
              fullWidth
              disabled={resetState.isLoading}
            >
              Reset Password
            </Button>

            <Box className="flex justify-between items-center mt-4 text-sm">
              <Link
                href="/login"
                className="text-blue-600 hover:text-blue-800 hover:underline transition-colors duration-200"
              >
                Back to Sign In
              </Link>
            </Box>
          </form>
        )}
      </Paper>
    </LoginFormLayout>
  )
}

export default ResetPasswordPage
