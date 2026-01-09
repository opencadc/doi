'use client'

import { SessionProvider } from 'next-auth/react'
import { ReactNode } from 'react'

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''

  return (
    <SessionProvider
      basePath={`${basePath}/api/auth`}
      refetchInterval={5 * 1000}
      refetchOnWindowFocus={true}
      refetchWhenOffline={false}
    >
      {children}
    </SessionProvider>
  )
}
