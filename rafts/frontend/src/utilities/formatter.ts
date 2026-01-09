import { User } from 'next-auth'

// Format date for display
export const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Format user name
export const formatUserName = (user?: User) => {
  if (!user) return 'Unknown User'
  return `${user.firstName} ${user.lastName}`
}

// Get user initials
export const getUserInitials = (user?: User) => {
  if (!user) return 'U'
  return `${user?.firstName?.[0]}${user?.lastName?.[0]}`.toUpperCase()
}
