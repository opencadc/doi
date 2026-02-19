import { Session } from 'next-auth'

export const isStaleSession = (session: Session | null): boolean =>
  !!session && (!session.user?.name || session.user.name.includes('undefined'))
