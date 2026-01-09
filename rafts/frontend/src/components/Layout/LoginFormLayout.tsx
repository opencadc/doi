import { ReactNode } from 'react'
import { Card, CardContent, CardHeader, Typography } from '@mui/material'

interface LoginFormLayoutProps {
  children: ReactNode
}

const LoginFormLayout = ({ children }: LoginFormLayoutProps) => {
  return (
    <div className="w-full min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader
          title={
            <Typography variant="h5" component="h1" className="text-center">
              Research Announcements For The Solar System (RAFTs)
            </Typography>
          }
        />
        <CardContent>{children}</CardContent>
      </Card>
    </div>
  )
}

export default LoginFormLayout
