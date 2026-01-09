import LoginFormLayout from '@/components/Layout/LoginFormLayout'
import { auth } from '@/auth/cadc-auth/credentials'
import UserProfile from '@/components/User/Profile'

const LoginPage = async () => {
  // Await the promises to get the actual values

  const session = await auth()

  // Log user roles and session info
  console.log('[Profile] Full session:', JSON.stringify(session, null, 2))
  console.log('[Profile] User:', JSON.stringify(session?.user, null, 2))
  console.log('[Profile] User role:', session?.user?.role)
  console.log('[Profile] User groups:', session?.user?.groups)

  if (!session || !session.user) {
    return null
  }
  return (
    <LoginFormLayout>
      <UserProfile
        user={{
          userId: session?.user?.id,
          name: session?.user?.name ?? undefined,
          email: session?.user?.email ?? undefined,
          role: session?.user?.role,
          affiliation: session?.user?.affiliation,
        }}
      />
    </LoginFormLayout>
  )
}

export default LoginPage
