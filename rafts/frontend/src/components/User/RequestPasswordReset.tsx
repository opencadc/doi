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
