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
import { Button, TextField, InputAdornment, Alert, Typography, Box, Paper } from '@mui/material'
import EmailIcon from '@mui/icons-material/Email'
import { useState } from 'react'
import Link from 'next/link'
import { requestPasswordReset } from '@/actions/user/requestPasswordReset'

export interface RequestPasswordResetFormValues {
  email: string
}

const RequestPasswordResetForm = () => {
  const t = useTranslations('password_reset') // Assuming you'll add these translations
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitResult, setSubmitResult] = useState<{
    success?: boolean
    error?: string
    message?: string
  }>({})

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RequestPasswordResetFormValues>({
    defaultValues: {
      email: '',
    },
  })

  const handleFormSubmit = async (values: RequestPasswordResetFormValues) => {
    setIsSubmitting(true)

    try {
      const result = await requestPasswordReset(values)
      setSubmitResult(result)
    } catch (error) {
      setSubmitResult({
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Paper elevation={3} className="p-6 max-w-md mx-auto">
      <Box className="flex flex-col gap-4">
        <Typography variant="h5" align="center" gutterBottom>
          {t('request_reset_title')}
        </Typography>

        <Typography variant="body2" align="center" color="textSecondary" gutterBottom>
          {t('request_reset_description')}
        </Typography>

        {submitResult.error && (
          <Alert severity="error" className="mb-4">
            {submitResult.error}
          </Alert>
        )}

        {submitResult.success && (
          <Alert severity="success" className="mb-4">
            {submitResult.message}
          </Alert>
        )}

        <form onSubmit={handleSubmit(handleFormSubmit)} className="flex flex-col gap-4">
          <TextField
            label={t('email')}
            {...register('email', {
              required: t('email_required'),
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: t('valid_email_required'),
              },
            })}
            error={!!errors.email}
            helperText={errors.email ? errors.email.message : ' '}
            fullWidth
            size="medium"
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailIcon />
                  </InputAdornment>
                ),
              },
            }}
            disabled={isSubmitting || submitResult.success}
          />

          <Button
            type="submit"
            variant="contained"
            size="large"
            className="mt-2"
            fullWidth
            disabled={isSubmitting || submitResult.success}
          >
            {isSubmitting ? t('submitting') : t('request_reset_button')}
          </Button>

          <Box className="flex justify-between items-center mt-4">
            <Link href="/login" className="text-sm text-blue-600 hover:underline">
              {t('back_to_login')}
            </Link>
            <Link href="/registration" className="text-sm text-blue-600 hover:underline">
              {t('create_account')}
            </Link>
          </Box>
        </form>
      </Box>
    </Paper>
  )
}

export default RequestPasswordResetForm
