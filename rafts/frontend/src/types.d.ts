import { DefaultSession } from 'next-auth'

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
    firstName?: string
    lastName?: string
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
