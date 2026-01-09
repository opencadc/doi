import { RaftData } from '@/types/doi'

export interface ReviewUser {
  _id: string
  firstName: string
  lastName: string
}

export interface ReviewComment {
  _id: string
  content: string
  createdBy: ReviewUser
  createdAt: string
  isResolved: boolean
  location?: string
  resolvedBy?: string
  resolvedAt?: string
}

export interface StatusChange {
  fromStatus: string
  toStatus: string
  changedBy: ReviewUser
  changedAt: string
  reason?: string
  _id: string
}

export interface RaftVersion {
  versionNumber: number
  raftData: RaftData
  createdAt: string
  createdBy: ReviewUser
  commitMessage?: string
  _id: string
}

export interface RaftReview {
  _id: string
  raftId: string
  currentVersion: number
  versions: RaftVersion[]
  statusHistory: StatusChange[]
  comments: ReviewComment[]
  assignedReviewers: ReviewUser[]
  isActive: boolean
  createdAt: string
  updatedAt: string
}
