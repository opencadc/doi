import { ReactElement } from 'react'
import { Metadata } from 'next'
import { RootLayoutProps } from '@/types/common'
import { useLocale } from 'next-intl'
import { ThemeProvider as NextThemesProvider } from 'next-themes'

//auth
import { AuthProvider } from '@/components/Providers/AuthProvider'

// Material UI
import '@fontsource/roboto/300.css'
import '@fontsource/roboto/400.css'
import '@fontsource/roboto/500.css'
import '@fontsource/roboto/700.css'
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter'
import ThemeProvider from '@/styles/ThemeProvider'

// Tailwind Global Styles (Load After MUI)
import './globals.css'
import ErrorBoundary from '@/components/ErrorBoundary/ErrorBoundary' // Move this import below MUI components

export const metadata: Metadata = {
  title: 'RAFTS',
  description: 'Research Announcements For The Solar System',
  icons: {
    icon: [{ url: '/favicon.ico', type: 'image/x-icon' }],
  },
}

const RootLayout = ({ children }: RootLayoutProps): ReactElement => {
  const locale = useLocale()
  return (
    <html lang={locale} suppressHydrationWarning>
      <body>
        <AuthProvider>
          <AppRouterCacheProvider options={{ enableCssLayer: true }}>
            <NextThemesProvider
              defaultTheme="system"
              enableSystem={true}
              attribute="class"
              disableTransitionOnChange
            >
              <ThemeProvider>
                <ErrorBoundary>{children}</ErrorBoundary>
              </ThemeProvider>
            </NextThemesProvider>
          </AppRouterCacheProvider>{' '}
        </AuthProvider>
      </body>
    </html>
  )
}

export default RootLayout
