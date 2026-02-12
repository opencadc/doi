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
