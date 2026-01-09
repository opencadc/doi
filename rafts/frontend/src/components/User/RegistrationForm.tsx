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
