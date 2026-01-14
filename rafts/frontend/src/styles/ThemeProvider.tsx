'use client'
import { ThemeProvider as MUIThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { useAppTheme } from './theme'
import { ReactNode, useEffect, useState } from 'react'

export default function ThemeProvider({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Get theme only after mounting to ensure correct dark/light mode
  const theme = useAppTheme()

  // Don't render MUI components until after hydration to prevent flash
  // next-themes sets the class on <html> before hydration via blocking script,
  // but MUI needs to wait for client-side JS to determine the correct theme
  if (!mounted) {
    // Return minimal shell that respects CSS variables set by next-themes
    return <div style={{ visibility: 'hidden' }}>{children}</div>
  }

  return (
    <MUIThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </MUIThemeProvider>
  )
}
