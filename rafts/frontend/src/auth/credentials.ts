import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { RAFT_LOGIN_URL } from '@/auth/constants'
import { User } from 'next-auth'
import { DefaultSession } from 'next-auth'
import 'next-auth/jwt'

declare module 'next-auth' {
  interface Session {
    accessToken?: string
    role?: string
    affiliation?: string
    user?: {
      id?: string
      role?: string
      groups?: string[]
      affiliation?: string
    } & DefaultSession['user']
  }

  interface User {
    id?: string
    name?: string | null
    email?: string | null
    accessToken?: string
    role?: string
    groups?: string[]
    affiliation?: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    accessToken?: string
    userId?: string
    role?: string
    groups?: string[]
    affiliation?: string
  }
}

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'RAFT Login',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials): Promise<User | null> {
        try {
          // Extract credentials
          const email = credentials?.email ? String(credentials.email) : ''
          const password = credentials?.password ? String(credentials.password) : ''

          // Build request options
          const options = {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'User-Agent': 'RAFT-System/1.0',
            },
            body: JSON.stringify({
              email,
              password,
            }),
          }

          const response = await fetch(RAFT_LOGIN_URL, options)

          if (!response.ok) {
            console.error('Login failed:', response.status, response.statusText)
            return null
          }

          // Parse the response data
          const responseData = await response.json()

          // Extract user information and token from the nested structure
          if (responseData?.data?.token && responseData?.data?.user) {
            const userData = responseData.data.user

            // Create the user object with all required fields
            const user: User = {
              id: userData._id,
              name: `${userData.firstName} ${userData.lastName}`,
              email: userData.email,
              accessToken: responseData.data.token,
              role: userData.role,
              affiliation: userData.affiliation,
            }

            return user
          }

          console.error('Invalid response structure')
          return null
        } catch (error) {
          console.error('Auth error:', error)
          return null
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // When user signs in, add their info to the JWT
      if (user) {
        token.accessToken = user.accessToken
        token.userId = user.id
        token.role = user.role
        token.affiliation = user.affiliation
      }

      return token
    },
    async session({ session, token }) {
      // Add token info to the session available client-side
      session.accessToken = token.accessToken

      if (session.user) {
        session.user.id = token.userId!
        session.user.role = token.role
        session.user.affiliation = token.affiliation
      }

      return session
    },
  },
  debug: process.env.NEXTAUTH_DEBUG === 'true' || process.env.NODE_ENV === 'development',
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  trustHost: true,
})
