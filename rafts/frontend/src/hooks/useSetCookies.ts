'use client'

import { useEffect, useState, useCallback } from 'react'
import { CADC_COOKIE_DOMAIN_URL, CANFAR_COOKIE_DOMAIN_URL } from '@/auth/cadc-auth/constants'
import { Session } from 'next-auth'

export function useSetCADCCookies(session: Session) {
  const [isSettingUp, setIsSettingUp] = useState(false)
  const [isSetupComplete, setIsSetupComplete] = useState(false)

  // Function to set up cookies using iframes
  const setupCookiesWithIframe = useCallback(async () => {
    if (!session?.accessToken || isSetupComplete) return false

    setIsSettingUp(true)

    try {
      // Create a promise that resolves when iframe loads or times out
      const loadInIframe = (url: string, token: string): Promise<boolean> => {
        return new Promise((resolve) => {
          const iframe = document.createElement('iframe')
          iframe.style.cssText = 'position:absolute;width:1px;height:1px;opacity:0;'
          iframe.src = `${url}${token}`

          // Set timeout to resolve after 5 seconds
          const timeout = setTimeout(() => {
            if (document.body.contains(iframe)) {
              document.body.removeChild(iframe)
            }
            resolve(true) // Assume success after timeout
          }, 5000)

          // Resolve when loaded
          iframe.onload = () => {
            clearTimeout(timeout)
            document.body.removeChild(iframe)
            resolve(true)
          }

          document.body.appendChild(iframe)
        })
      }

      // Load both endpoints sequentially
      await loadInIframe(CANFAR_COOKIE_DOMAIN_URL, session.accessToken)
      await loadInIframe(CADC_COOKIE_DOMAIN_URL, session.accessToken)

      setIsSetupComplete(true)
      return true
    } catch (error) {
      console.error('Error setting CADC cookies:', error)
      return false
    } finally {
      setIsSettingUp(false)
    }
  }, [session?.accessToken, isSetupComplete])

  // Automatic setup
  useEffect(() => {
    if (session?.accessToken && !isSetupComplete && !isSettingUp) {
      setupCookiesWithIframe()
    }
  }, [session, isSetupComplete, isSettingUp, setupCookiesWithIframe])

  // Return function for manual triggering
  return {
    setupCookies: setupCookiesWithIframe,
    isSettingUp,
    isSetupComplete,
  }
}
