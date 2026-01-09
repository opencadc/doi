/**
 * API Route: Attachment Proxy
 *
 * Proxies attachment downloads from VOSpace to avoid CORS issues.
 * This allows images and other files to be displayed in the browser.
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth/cadc-auth/credentials'
import { downloadAttachment } from '@/services/attachmentService'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ doiId: string; filename: string }> },
) {
  const { doiId, filename } = await params

  // Get session for authentication
  const session = await auth()
  const accessToken = session?.accessToken

  if (!accessToken) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  try {
    // Decode the filename (it may be URL encoded)
    const decodedFilename = decodeURIComponent(filename)

    console.log('[API attachments] Fetching:', doiId, decodedFilename)

    // Download from VOSpace
    const result = await downloadAttachment(doiId, decodedFilename, accessToken, false)

    if (!result.success || !result.content) {
      console.error('[API attachments] Download failed:', result.error)
      return NextResponse.json({ error: result.error || 'Download failed' }, { status: 404 })
    }

    // Convert content to ArrayBuffer for response
    let arrayBuffer: ArrayBuffer

    if (result.content instanceof Blob) {
      arrayBuffer = await result.content.arrayBuffer()
    } else if (typeof result.content === 'string') {
      // Text content - encode as UTF-8
      const encoder = new TextEncoder()
      const encoded = encoder.encode(result.content)
      // Create a proper ArrayBuffer copy to satisfy TypeScript
      arrayBuffer = new Uint8Array(encoded).buffer as ArrayBuffer
    } else {
      return NextResponse.json({ error: 'Invalid content type' }, { status: 500 })
    }

    // Return the file with appropriate headers
    return new NextResponse(arrayBuffer, {
      headers: {
        'Content-Type': result.mimeType || 'application/octet-stream',
        'Content-Disposition': `inline; filename="${decodedFilename}"`,
        'Cache-Control': 'private, max-age=3600', // Cache for 1 hour
      },
    })
  } catch (error) {
    console.error('[API attachments] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
