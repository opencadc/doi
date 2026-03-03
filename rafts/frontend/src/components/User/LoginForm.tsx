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
import { Button, TextField, InputAdornment, IconButton, Alert } from '@mui/material'
import VisibilityIcon from '@mui/icons-material/Visibility'
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff'
import UserIcon from '@mui/icons-material/VerifiedUser'
import { useState } from 'react'
import { AuthState, LoginFormValues } from '@/actions/auth'
import Turnstile from './Turnstile'

interface LoginFormProps {
  authAction: (
    prevState: AuthState | null,
    formData: LoginFormValues,
  ) => Promise<{
    success: boolean
    error: string | null
  }>
  returnUrl: string
}

const initialState = {
  success: false,
  error: null,
}

const LoginForm = ({ authAction, returnUrl }: LoginFormProps) => {
  const t = useTranslations('login')
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [state, setState] = useState<AuthState | null>(initialState)
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)

  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    defaultValues: {
      username: '',
      password: '',
    },
  })

  const handleFormSubmit = async (values: LoginFormValues) => {
    // Require Turnstile verification if enabled
    if (turnstileSiteKey && !turnstileToken) {
      setState({
        success: false,
        error: 'Please complete the security verification',
      })
      return
    }

    setIsSubmitting(true)

    try {
      // Call the server action with the form data and turnstile token
      const result = await authAction(null, {
        ...values,
        turnstileToken: turnstileToken || undefined,
      })
      setState(result)

      // Handle successful login with a single redirect
      if (result.success) {
        // Use hard navigation to ensure server components refresh with new session
        const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''
        const url = returnUrl.startsWith(basePath) ? returnUrl : `${basePath}${returnUrl}`
        window.location.href = url
      }
    } catch (error) {
      console.error('Login error:', error)
      setState({
        success: false,
        error: 'An unexpected error occurred',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit(handleFormSubmit)}
      className="flex flex-col gap-4 p-4 w-full max-w-lg mx-auto"
    >
      {state?.error && (
        <Alert severity="error" className="mb-4">
          {state.error}
        </Alert>
      )}

      <TextField
        label={t('username')}
        {...register('username', { required: true })}
        error={!!errors.username}
        helperText={errors.username ? t('required') : ' '}
        fullWidth
        size="medium"
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <UserIcon />
              </InputAdornment>
            ),
          },
        }}
        disabled={isSubmitting}
      />

      <TextField
        label={t('password')}
        {...register('password', { required: true })}
        type={showPassword ? 'text' : 'password'}
        error={!!errors.password}
        helperText={errors.password ? t('required') : ' '}
        fullWidth
        size="medium"
        slotProps={{
          input: {
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  aria-label="toggle password visibility"
                  onClick={() => setShowPassword(!showPassword)}
                  edge="end"
                >
                  {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                </IconButton>
              </InputAdornment>
            ),
          },
        }}
        disabled={isSubmitting}
      />
      <div className="flex justify-between">
        <a
          href="https://www.cadc-ccda.hia-iha.nrc-cnrc.gc.ca/en/auth/resetPassword.html"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 hover:underline transition-colors duration-200"
        >
          {t('forgot_password')}
        </a>
        <a
          href="https://www.cadc-ccda.hia-iha.nrc-cnrc.gc.ca/en/auth/request.html"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 hover:underline transition-colors duration-200"
        >
          {t('create_account')}
        </a>
      </div>

      {turnstileSiteKey && (
        <div className="flex justify-center my-4">
          <Turnstile
            siteKey={turnstileSiteKey}
            onVerify={(token) => setTurnstileToken(token)}
            onExpire={() => setTurnstileToken(null)}
            onError={() => setTurnstileToken(null)}
          />
        </div>
      )}

      <Button
        type="submit"
        variant="contained"
        size="large"
        className="mt-2"
        fullWidth
        disabled={isSubmitting}
      >
        {isSubmitting ? t('signing_in') : t('sign_in')}
      </Button>
    </form>
  )
}

export default LoginForm
