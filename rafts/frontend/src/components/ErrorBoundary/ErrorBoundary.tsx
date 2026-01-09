'use client'

import { Component, ReactNode, useEffect, ErrorInfo } from 'react'
import { Button, Typography, Paper, Box, Alert } from '@mui/material'
import { RefreshCw } from 'lucide-react'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  disableCapturing?: boolean
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

/**
 * Error boundary component for catching and handling client-side errors
 *
 * @param children - The components to be wrapped by the error boundary
 * @param fallback - Optional custom fallback UI to show when an error occurs
 * @param onError - Optional callback for error reporting
 * @param disableCapturing - Disable global event capturing (useful in dev mode with Next.js overlay)
 */
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // You can log the error to an error reporting service
    console.error('Error caught by boundary:', error, errorInfo)

    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }
  }

  resetError = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    const { hasError, error } = this.state
    const { children, fallback, disableCapturing = false } = this.props

    // If we have an error, render the fallback or default error UI
    if (hasError) {
      if (fallback) {
        return <>{fallback}</>
      }

      return (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '300px',
            p: 4,
          }}
        >
          <Paper
            elevation={3}
            sx={{
              p: 4,
              maxWidth: '600px',
              width: '100%',
              borderLeft: '4px solid',
              borderColor: 'error.main',
              zIndex: 9999, // Ensure it's above Next.js error overlay
              position: 'relative',
            }}
          >
            <Typography variant="h5" gutterBottom color="error.main">
              Something went wrong
            </Typography>

            <Alert severity="error" sx={{ my: 2 }}>
              {error?.message || 'An unexpected error occurred'}
            </Alert>

            <Typography variant="body2" color="text.secondary" paragraph>
              The application encountered an error. You can try refreshing the page or resetting the
              component.
              {process.env.NODE_ENV === 'development' && (
                <Typography component="span" fontStyle="italic" display="block" mt={1}>
                  Note: You may need to create a new raft the old one does not meet new
                  requirements.{' '}
                </Typography>
              )}
            </Typography>

            <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                color="primary"
                onClick={this.resetError}
                startIcon={<RefreshCw size={16} />}
              >
                Reset
              </Button>
              <Button variant="outlined" onClick={() => window.location.replace('/')}>
                Navigate Home
              </Button>
            </Box>
          </Paper>
        </Box>
      )
    }

    // If disableCapturing is false, we still want to capture unhandled errors
    if (!disableCapturing) {
      return <ErrorEventCapturer setError={this.setState.bind(this)}>{children}</ErrorEventCapturer>
    }

    // No error, render children
    return <>{children}</>
  }
}

// Component to capture global errors not caught by React's error boundary
interface ErrorEventCapturerProps {
  children: ReactNode
  setError: (state: ErrorBoundaryState) => void
}

function ErrorEventCapturer({ children, setError }: ErrorEventCapturerProps) {
  useEffect(() => {
    // Define error handler for uncaught exceptions
    const errorHandler = (event: ErrorEvent) => {
      // Prevent handling the same error twice
      if (event.error && event.error._handled) return

      // Mark error as handled to prevent duplication
      if (event.error) {
        event.error._handled = true
      }

      console.error('Global error caught:', event)
      setError({
        hasError: true,
        error: event.error || new Error(event.message),
      })
    }

    // Define promise rejection handler
    const rejectionHandler = (event: PromiseRejectionEvent) => {
      // Prevent handling the same rejection twice
      if (event.reason && event.reason._handled) return

      // Mark error as handled to prevent duplication
      if (event.reason) {
        event.reason._handled = true
      }

      console.error('Promise rejection caught:', event)
      setError({
        hasError: true,
        error: event.reason instanceof Error ? event.reason : new Error(String(event.reason)),
      })
    }

    // Only add global listeners in production
    // In development, let Next.js handle the errors for better debugging
    if (process.env.NODE_ENV === 'production') {
      window.addEventListener('error', errorHandler)
      window.addEventListener('unhandledrejection', rejectionHandler)

      return () => {
        window.removeEventListener('error', errorHandler)
        window.removeEventListener('unhandledrejection', rejectionHandler)
      }
    }

    return undefined
  }, [setError])

  return <>{children}</>
}

export default ErrorBoundary
