import NextAuth, { User } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'

import { fetchUserInfo } from './fetchUserInfo'
import { fetchUserGroups } from './fetchUserGroups'
import { authenticateUser } from '@/auth/cadc-auth/authenticateUser'

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'CADC Login',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials): Promise<User | null> {
        try {
          if (!credentials?.username || !credentials?.password) {
            return null
          }

          // Step 1: Authenticate and get token
          const token = await authenticateUser(
            credentials.username as string,
            credentials.password as string,
          )

          if (!token) return null
          /*// Step 2: Setup cross-domain cookies if needed
         await setupCrossDomainCookies(token, `${CANFAR_COOKIE_DOMAIN_URL}${token}`)
         await setupCrossDomainCookies(token, `${CADC_COOKIE_DOMAIN_URL}${token}`)
 */
          // Step 3: Fetch user information
          const user: User | null = await fetchUserInfo(token)

          // Step 4: Fetch user groups/roles
          const { role: userRole, groups: userGroups } = await fetchUserGroups(token)
          // Step 5: Combine all information into a complete user object
          return {
            id: credentials.username as string,
            ...user,
            accessToken: token,
            role: userRole,
            groups: userGroups,
          }
        } catch {
          // Authentication failed
        }
        return null
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.accessToken = user.accessToken
        token.userId = user.id
        token.role = user.role
        token.groups = user.groups
        token.affiliation = user.affiliation
        token.name = user.firstName + ' ' + user.lastName
      }
      return token
    },
    async session({ session, token }) {
      // Add information to the session that will be available client-side
      session.accessToken = token.accessToken

      if (session.user) {
        session.user.id = token?.userId ? token.userId : ''
        session.user.role = token?.role ? (token.role as string) : undefined
        session.user.groups = token?.groups ? (token.groups as string[]) : []
        session.user.affiliation = token.affiliation
        session.user.name = token.name
      }

      return session
    },
  },
  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  trustHost: true,
})
