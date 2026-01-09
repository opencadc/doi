/**
 * Utility functions for managing form state persistence with localStorage
 */
import { TRaftContext } from '@/context/types'

const STORAGE_KEY = 'raft_form_data'

/**
 * Save RAFT form data to localStorage
 */
export const saveRaftData = (data: TRaftContext): void => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    } catch (error) {
      console.error('Error saving RAFT data to localStorage:', error)
    }
  }
}

/**
 * Load RAFT form data from localStorage
 */
export const loadRaftData = (): TRaftContext | null => {
  if (typeof window !== 'undefined') {
    try {
      const savedData = localStorage.getItem(STORAGE_KEY)
      return savedData ? JSON.parse(savedData) : null
    } catch (error) {
      console.error('Error loading RAFT data from localStorage:', error)
      return null
    }
  }
  return null
}

/**
 * Clear RAFT form data from localStorage
 */
export const clearRaftData = (): void => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch (error) {
      console.error('Error clearing RAFT data from localStorage:', error)
    }
  }
}
