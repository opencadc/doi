import { TRaftSubmission } from '@/shared/model'

export interface DOIData {
  identifier: string
  identifierType: string
  title: string
  titleLang: string | null
  status: string
  dataDirectory: string
  journalRef: string | null
  /** Assigned reviewer username (only visible to publishers/reviewers) */
  reviewer: string | null
}

export interface RaftData extends TRaftSubmission {
  _id: string
  id?: string
  relatedRafts: string[]
  generateForumPost: boolean
  createdBy: string
  createdAt: string
  updatedAt: string
  doi?: string
  /** Data directory path for storage links (e.g., /rafts-test/RAFTS-xxx/data) */
  dataDirectory?: string
  /** Assigned reviewer username (from DOI backend) */
  reviewer?: string | null
}
