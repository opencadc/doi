import { NextRequest, NextResponse } from 'next/server'
import { getDOIXml, updateDOIXml } from '@/actions/updateDOIXml'

// GET /api/doi/[id] - Fetch DOI XML
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  console.log('[API GET /api/doi] Fetching DOI:', id)

  const result = await getDOIXml(id)

  if (!result.success) {
    return NextResponse.json({ error: result.message }, { status: 400 })
  }

  return new NextResponse(result.data, {
    headers: { 'Content-Type': 'application/xml' },
  })
}

// POST /api/doi/[id] - Update DOI via POST
// Body: { doiMetaData?: object, doiNodeData?: { status?, journalRef?, reviewer? } }
//
// Updatable fields:
// - doiMetaData: creators, titles, publicationYear, language
// - doiNodeData: status, journalRef, reviewer
//
// NOTE: dataDirectory is NOT modifiable - it's computed from backend config
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  console.log('[API POST /api/doi] Updating DOI:', id)

  const body = await request.json()
  const { doiMetaData, doiNodeData } = body

  console.log('[API POST /api/doi] doiMetaData:', doiMetaData)
  console.log('[API POST /api/doi] doiNodeData:', doiNodeData)

  if (!doiMetaData && !doiNodeData) {
    return NextResponse.json(
      { error: 'At least one of doiMetaData or doiNodeData is required' },
      { status: 400 },
    )
  }

  const updateResult = await updateDOIXml(id, doiMetaData, doiNodeData)

  if (!updateResult.success) {
    return NextResponse.json({ error: updateResult.message }, { status: 400 })
  }

  return NextResponse.json({ success: true, data: updateResult.data })
}
