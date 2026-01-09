'use client'

import { useForm } from 'react-hook-form'
import { useTranslations } from 'next-intl'
import { Button, TextField, InputAdornment, IconButton, Alert } from '@mui/material'
import VisibilityIcon from '@mui/icons-material/Visibility'
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff'
import UserIcon from '@mui/icons-material/VerifiedUser'
import { useState } from 'react'
import Link from 'next/link'
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
        window.location.href = returnUrl
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
      <Link
        href="/request-password-reset"
        className="text-blue-600 hover:text-blue-800 hover:underline transition-colors duration-200"
      >
        {t('forgot_password')}
      </Link>

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
