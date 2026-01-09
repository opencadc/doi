'use client'
import { ThemeProvider as MUIThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { useAppTheme, staticTheme } from './theme'
import { ReactNode, useEffect, useState } from 'react'

export default function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useAppTheme()
  const [mounted, setMounted] = useState(false)

  // After mounting, we have access to the theme
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    // Return the static theme for SSR
    return (
      <MUIThemeProvider theme={staticTheme} defaultMode={'system'}>
        <CssBaseline />
        {children}
      </MUIThemeProvider>
    )
  }

  return (
    <MUIThemeProvider theme={theme} defaultMode={'system'}>
      <CssBaseline />
      {children}
    </MUIThemeProvider>
  )
}
