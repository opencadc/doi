/**
 * Attachment types and utilities for VOSpace file storage
 *
 * This module provides type definitions and utility functions for managing
 * file attachments in the RAFT form system. Attachments are stored in VOSpace
 * and referenced in the RAFT.json via FileReference objects.
 */

/**
 * Represents a file stored in VOSpace
 * Used instead of inline base64/text content
 */
export interface FileReference {
  /** Discriminator for type detection */
  type: 'file-reference'
  /** Original filename (e.g., "figure.png") */
  filename: string
  /** MIME type (e.g., "image/png", "text/plain") */
  mimeType: string
  /** File size in bytes */
  size: number
  /** ISO timestamp when uploaded */
  uploadedAt: string
}

/**
 * Attachment field value - can be legacy content or new FileReference
 */
export type AttachmentValue = string | FileReference | undefined

/**
 * Supported attachment types in the form
 */
export type AttachmentType = 'figure' | 'ephemeris' | 'orbital' | 'spectrum' | 'astrometry'

/**
 * Configuration for each attachment type
 */
export interface AttachmentConfig {
  /** Field name in the form data */
  fieldName: string
  /** Default filename for this attachment type */
  defaultFilename: string
  /** Allowed MIME types */
  allowedMimeTypes: string[]
  /** Maximum file size in bytes */
  maxSize: number
  /** Whether content is binary (true) or text (false) */
  isBinary: boolean
}

/**
 * Attachment configurations by type
 */
export const ATTACHMENT_CONFIGS: Record<AttachmentType, AttachmentConfig> = {
  figure: {
    fieldName: 'figure',
    defaultFilename: 'figure.png',
    allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg'],
    maxSize: 5 * 1024 * 1024, // 5MB
    isBinary: true,
  },
  ephemeris: {
    fieldName: 'ephemeris',
    defaultFilename: 'ephemeris.txt',
    allowedMimeTypes: ['text/plain'],
    maxSize: 5 * 1024 * 1024,
    isBinary: false,
  },
  orbital: {
    fieldName: 'orbitalElements',
    defaultFilename: 'orbital.txt',
    allowedMimeTypes: ['text/plain'],
    maxSize: 5 * 1024 * 1024,
    isBinary: false,
  },
  spectrum: {
    fieldName: 'spectroscopy',
    defaultFilename: 'spectrum.txt',
    allowedMimeTypes: ['text/plain'],
    maxSize: 5 * 1024 * 1024,
    isBinary: false,
  },
  astrometry: {
    fieldName: 'astrometry',
    defaultFilename: 'astrometry.xml',
    allowedMimeTypes: ['application/xml', 'text/xml', 'text/plain'],
    maxSize: 5 * 1024 * 1024,
    isBinary: false,
  },
}

// ============================================================================
// Type Guards and Detection Utilities
// ============================================================================

/**
 * Check if a value is a FileReference object
 */
export function isFileReference(value: unknown): value is FileReference {
  return (
    typeof value === 'object' &&
    value !== null &&
    'type' in value &&
    (value as FileReference).type === 'file-reference' &&
    'filename' in value &&
    'mimeType' in value &&
    'size' in value
  )
}

/**
 * Parse a stored attachment value (could be FileReference JSON string, base64, or text)
 * Returns the appropriate AttachmentValue type
 */
export function parseStoredAttachment(value: unknown): AttachmentValue {
  if (!value) return undefined
  if (isFileReference(value)) return value

  // Try to parse as JSON string that might be a serialized FileReference
  if (typeof value === 'string') {
    // Check if it looks like a JSON object (starts with {)
    if (value.startsWith('{')) {
      try {
        const parsed = JSON.parse(value)
        if (isFileReference(parsed)) {
          return parsed
        }
      } catch {
        // Not valid JSON, treat as regular string
      }
    }
    // Return as-is (base64 or text content)
    return value
  }

  return undefined
}

/**
 * Check if a string is a base64 data URL (for images)
 */
export function isBase64DataUrl(value: unknown): boolean {
  return typeof value === 'string' && value.startsWith('data:')
}

/**
 * Check if a string is a base64 image data URL
 */
export function isBase64Image(value: unknown): boolean {
  return typeof value === 'string' && value.startsWith('data:image/')
}

/**
 * Check if a value is inline text content (not base64, not FileReference)
 */
export function isInlineTextContent(value: unknown): boolean {
  return typeof value === 'string' && value.length > 0 && !isBase64DataUrl(value)
}

/**
 * Check if a value has any attachment content
 */
export function hasAttachmentContent(value: unknown): boolean {
  if (!value) return false
  if (isFileReference(value)) return true
  if (typeof value === 'string' && value.length > 0) return true
  return false
}

// ============================================================================
// FileReference Utilities
// ============================================================================

/**
 * Create a FileReference object
 */
export function createFileReference(
  filename: string,
  mimeType: string,
  size: number,
): FileReference {
  return {
    type: 'file-reference',
    filename,
    mimeType,
    size,
    uploadedAt: new Date().toISOString(),
  }
}

/**
 * Generate a unique filename with timestamp to avoid collisions
 */
export function generateUniqueFilename(originalFilename: string): string {
  const timestamp = Date.now()
  const ext = getFileExtension(originalFilename)
  const baseName = getFileBaseName(originalFilename)
  return `${baseName}-${timestamp}${ext}`
}

/**
 * Get file extension including the dot (e.g., ".png")
 */
export function getFileExtension(filename: string): string {
  const lastDot = filename.lastIndexOf('.')
  return lastDot >= 0 ? filename.slice(lastDot) : ''
}

/**
 * Get filename without extension
 */
export function getFileBaseName(filename: string): string {
  const lastDot = filename.lastIndexOf('.')
  return lastDot >= 0 ? filename.slice(0, lastDot) : filename
}

/**
 * Sanitize filename for safe storage
 * Removes special characters, replaces spaces with underscores
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_') // Replace special chars with underscore
    .replace(/_+/g, '_') // Collapse multiple underscores
    .replace(/^_|_$/g, '') // Remove leading/trailing underscores
}

// ============================================================================
// MIME Type Utilities
// ============================================================================

/**
 * Get MIME type from file extension
 */
export function getMimeTypeFromExtension(filename: string): string {
  const ext = getFileExtension(filename).toLowerCase()
  const mimeTypes: Record<string, string> = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.txt': 'text/plain',
    '.xml': 'application/xml',
    '.json': 'application/json',
    '.psv': 'text/plain',
    '.mpc': 'text/plain',
  }
  return mimeTypes[ext] || 'application/octet-stream'
}

/**
 * Get file extension from MIME type
 */
export function getExtensionFromMimeType(mimeType: string): string {
  const extensions: Record<string, string> = {
    'image/png': '.png',
    'image/jpeg': '.jpg',
    'image/jpg': '.jpg',
    'image/gif': '.gif',
    'text/plain': '.txt',
    'application/xml': '.xml',
    'text/xml': '.xml',
    'application/json': '.json',
  }
  return extensions[mimeType] || ''
}

/**
 * Check if MIME type is an image
 */
export function isImageMimeType(mimeType: string): boolean {
  return mimeType.startsWith('image/')
}

/**
 * Check if MIME type is text-based
 */
export function isTextMimeType(mimeType: string): boolean {
  return (
    mimeType.startsWith('text/') ||
    mimeType === 'application/xml' ||
    mimeType === 'application/json'
  )
}

// ============================================================================
// Validation Utilities
// ============================================================================

/**
 * Validate file against attachment configuration
 */
export function validateAttachment(
  file: File,
  config: AttachmentConfig,
): { valid: boolean; error?: string } {
  // Check file size
  if (file.size > config.maxSize) {
    const maxSizeMB = config.maxSize / (1024 * 1024)
    return {
      valid: false,
      error: `File size exceeds maximum of ${maxSizeMB}MB`,
    }
  }

  // Check MIME type
  const isAllowedType = config.allowedMimeTypes.some(
    (allowed) => file.type === allowed || file.type.startsWith(allowed.replace('/*', '/')),
  )

  // If MIME type check fails, try extension-based validation for text files
  // Browsers often report empty or generic MIME types for .psv, .mpc, etc.
  if (!isAllowedType) {
    const ext = getFileExtension(file.name).toLowerCase()
    const textExtensions = ['.txt', '.psv', '.mpc', '.xml']
    const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif']

    // For text-based configs, allow known text file extensions
    if (!config.isBinary && textExtensions.includes(ext)) {
      return { valid: true }
    }

    // For binary (image) configs, allow known image extensions
    if (config.isBinary && imageExtensions.includes(ext)) {
      return { valid: true }
    }

    return {
      valid: false,
      error: `File type ${file.type || 'unknown'} is not allowed. Allowed types: ${config.allowedMimeTypes.join(', ')}`,
    }
  }

  return { valid: true }
}

/**
 * Get attachment config by field name
 */
export function getConfigByFieldName(fieldName: string): AttachmentConfig | undefined {
  return Object.values(ATTACHMENT_CONFIGS).find((config) => config.fieldName === fieldName)
}

// ============================================================================
// Base64 Conversion Utilities
// ============================================================================

/**
 * Convert a Blob to base64 data URL
 */
export async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('Failed to convert blob to base64'))
    reader.readAsDataURL(blob)
  })
}

/**
 * Convert base64 data URL to Blob
 */
export function base64ToBlob(base64: string): Blob {
  const [header, data] = base64.split(',')
  const mimeType = header.match(/data:([^;]+)/)?.[1] || 'application/octet-stream'
  const binary = atob(data)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return new Blob([bytes], { type: mimeType })
}

/**
 * Extract MIME type from base64 data URL
 */
export function getMimeTypeFromBase64(base64: string): string {
  const match = base64.match(/data:([^;]+)/)
  return match ? match[1] : 'application/octet-stream'
}
