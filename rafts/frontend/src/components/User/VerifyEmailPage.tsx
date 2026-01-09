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
