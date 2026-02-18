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

import { useForm } from 'react-hook-form'
import { useTranslations } from 'next-intl'
import {
  Button,
  TextField,
  InputAdornment,
  IconButton,
  Alert,
  Box,
  Paper,
  Typography,
  Link as MuiLink,
} from '@mui/material'
import VisibilityIcon from '@mui/icons-material/Visibility'
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff'
import PersonIcon from '@mui/icons-material/Person'
import EmailIcon from '@mui/icons-material/Email'
import BusinessIcon from '@mui/icons-material/Business'
import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import Link from 'next/link'
import { registerUser } from '@/actions/user/registerUser'

// Define validation schema
const registerSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  affiliation: z.string().optional(),
})

type RegisterFormValues = z.infer<typeof registerSchema>

const RegistrationForm = () => {
  const t = useTranslations('registration')
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formState, setFormState] = useState({
    success: false,
    error: null as string | null,
    message: null as string | null,
  })

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      affiliation: '',
    },
  })

  const handleFormSubmit = async (values: RegisterFormValues) => {
    setIsSubmitting(true)
    try {
      // Call the server action directly
      const result = await registerUser(values)

      if (result.success) {
        setFormState({
          success: true,
          error: null,
          message:
            result.message ||
            'Registration successful. Please check your email to verify your account.',
        })
      } else {
        setFormState({
          success: false,
          error: result.error || 'Registration failed. Please try again.',
          message: null,
        })
      }
    } catch (error) {
      setFormState({
        success: false,
        error: 'An unexpected error occurred. Please try again.',
        message: null,
      })
      console.error('Registration error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Paper elevation={3} className="p-6 w-full max-w-md mx-auto">
      <Typography variant="h5" component="h1" className="mb-6 text-center">
        {t('create_account')}
      </Typography>

      {formState.error && (
        <Alert severity="error" className="mb-4">
          {formState.error}
        </Alert>
      )}

      {formState.success && (
        <Alert severity="success" className="mb-4">
          {formState.message}
        </Alert>
      )}

      <form onSubmit={handleSubmit(handleFormSubmit)} className="flex flex-col gap-4">
        <Box className="flex gap-4">
          <TextField
            label={t('first_name')}
            {...register('firstName')}
            error={!!errors.firstName}
            helperText={errors.firstName?.message || ' '}
            fullWidth
            size="medium"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <PersonIcon />
                </InputAdornment>
              ),
            }}
            disabled={isSubmitting || formState.success}
          />

          <TextField
            label={t('last_name')}
            {...register('lastName')}
            error={!!errors.lastName}
            helperText={errors.lastName?.message || ' '}
            fullWidth
            size="medium"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <PersonIcon />
                </InputAdornment>
              ),
            }}
            disabled={isSubmitting || formState.success}
          />
        </Box>

        <TextField
          label={t('email')}
          type="email"
          {...register('email')}
          error={!!errors.email}
          helperText={errors.email?.message || ' '}
          fullWidth
          size="medium"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <EmailIcon />
              </InputAdornment>
            ),
          }}
          disabled={isSubmitting || formState.success}
        />

        <TextField
          label={t('password')}
          {...register('password')}
          type={showPassword ? 'text' : 'password'}
          error={!!errors.password}
          helperText={errors.password?.message || ' '}
          fullWidth
          size="medium"
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  aria-label="toggle password visibility"
                  onClick={() => setShowPassword(!showPassword)}
                  edge="end"
                  disabled={isSubmitting || formState.success}
                >
                  {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                </IconButton>
              </InputAdornment>
            ),
          }}
          disabled={isSubmitting || formState.success}
        />

        <TextField
          label={t('affiliation')}
          {...register('affiliation')}
          error={!!errors.affiliation}
          helperText={errors.affiliation?.message || t('affiliation_helper')}
          fullWidth
          size="medium"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <BusinessIcon />
              </InputAdornment>
            ),
          }}
          disabled={isSubmitting || formState.success}
        />

        <Button
          type="submit"
          variant="contained"
          size="large"
          className="mt-4"
          fullWidth
          disabled={isSubmitting || formState.success}
        >
          {isSubmitting ? t('registering') : t('register')}
        </Button>

        <Box className="mt-4 text-center">
          <Typography variant="body2">
            {t('already_have_account')}{' '}
            <MuiLink component={Link} href="/login">
              {t('sign_in')}
            </MuiLink>
          </Typography>
        </Box>
      </form>
    </Paper>
  )
}

export default RegistrationForm
