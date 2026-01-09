// app/[locale]/login/page.tsx
import { redirect } from 'next/navigation'
import LoginForm from '@/components/User/LoginForm'
import LoginFormLayout from '@/components/Layout/LoginFormLayout'
import { auth } from '@/auth/cadc-auth/credentials'
import { authenticateUser } from '@/actions/auth'

// Define types that match what Next.js is expecting
interface PageProps {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

const LoginPage = async ({ searchParams }: PageProps) => {
  // Await the promises to get the actual values
  const resolvedSearchParams = await searchParams

  const session = await auth()
  const defaultReturnUrl = '/'

  if (session) {
    redirect((resolvedSearchParams.returnUrl as string) || defaultReturnUrl)
  }

  return (
    <LoginFormLayout>
      <LoginForm
        authAction={authenticateUser}
        returnUrl={(resolvedSearchParams.returnUrl as string) || '/'}
      />
    </LoginFormLayout>
  )
}

export default LoginPage
