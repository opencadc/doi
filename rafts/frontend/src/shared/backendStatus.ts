// Backend status values from DOI service
// These are the actual status values used by the DOI backend API

export const BACKEND_STATUS = {
  IN_PROGRESS: 'in progress',
  REVIEW_READY: 'review ready',
  IN_REVIEW: 'in review',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  MINTED: 'minted',
} as const

export type BackendStatusType = (typeof BACKEND_STATUS)[keyof typeof BACKEND_STATUS]

/**
 * Status workflow:
 *
 * in progress (Draft) → author submits → review ready
 * review ready → publisher claims → in review (+ assigns reviewer)
 * review ready → author cancels → in progress
 * in review → publisher approves → approved
 * in review → publisher rejects → rejected
 * in review → request revision → in progress
 * approved → in progress (revision)
 * rejected → in progress (revision)
 */
