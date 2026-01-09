import { describe, it, expect } from 'vitest'
import { formatDate, formatUserName, getUserInitials } from '../formatter'

describe('formatDate', () => {
  it('formats a valid date string correctly', () => {
    const result = formatDate('2025-07-15T10:30:00Z')
    // The exact output depends on timezone, but it should contain expected parts
    expect(result).toMatch(/Jul/)
    expect(result).toMatch(/15/)
    expect(result).toMatch(/2025/)
  })

  it('handles ISO date strings', () => {
    // Use a mid-day time to avoid timezone edge cases
    const result = formatDate('2024-06-15T12:00:00.000Z')
    expect(result).toMatch(/Jun/)
    expect(result).toMatch(/15/)
    expect(result).toMatch(/2024/)
  })
})

describe('formatUserName', () => {
  it('returns full name when user has firstName and lastName', () => {
    const user = {
      firstName: 'John',
      lastName: 'Doe',
      id: '1',
      email: 'john@example.com',
    }
    expect(formatUserName(user)).toBe('John Doe')
  })

  it('returns "Unknown User" when user is undefined', () => {
    expect(formatUserName(undefined)).toBe('Unknown User')
  })

  it('handles empty strings in name', () => {
    const user = {
      firstName: '',
      lastName: 'Doe',
      id: '1',
      email: 'test@example.com',
    }
    expect(formatUserName(user)).toBe(' Doe')
  })
})

describe('getUserInitials', () => {
  it('returns uppercase initials for valid user', () => {
    const user = {
      firstName: 'John',
      lastName: 'Doe',
      id: '1',
      email: 'john@example.com',
    }
    expect(getUserInitials(user)).toBe('JD')
  })

  it('returns "U" when user is undefined', () => {
    expect(getUserInitials(undefined)).toBe('U')
  })

  it('handles lowercase names', () => {
    const user = {
      firstName: 'jane',
      lastName: 'smith',
      id: '1',
      email: 'jane@example.com',
    }
    expect(getUserInitials(user)).toBe('JS')
  })

  it('handles single character names', () => {
    const user = {
      firstName: 'A',
      lastName: 'B',
      id: '1',
      email: 'ab@example.com',
    }
    expect(getUserInitials(user)).toBe('AB')
  })
})
