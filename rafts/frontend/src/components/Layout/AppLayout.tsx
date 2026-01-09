import { ReactNode } from 'react'
import AppBar from '@/components/Layout/AppBar'
import { auth } from '@/auth/cadc-auth/credentials'
import { VersionInfo } from '@/components/VersionInfo'

interface AppLayoutProps {
  children: ReactNode
}

const AppLayout = async ({ children }: AppLayoutProps) => {
  const session = await auth()

  return (
    <div className="w-full min-h-screen flex flex-col ">
      <AppBar session={session} />
      <main className="flex-1 w-full flex flex-col h-screen">{children}</main>
      <footer className="w-full flex gap-6 flex-wrap items-center justify-center p-8">
        <div className="flex flex-col gap-8 items-center">Footer</div>
      </footer>
      <VersionInfo />
    </div>
  )
}

export default AppLayout
