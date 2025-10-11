/**
 * API Routes: /api/moments/[id]
 *
 * GET    - Get single moment (supports full/lightweight modes)
 * PATCH  - Update moment (ownership verified)
 * DELETE - Delete moment (ownership verified)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth-config'
import { executeUserQuery, executeUserWrite, verifyNodeOwnership } from '@/lib/neo4j-auth'

/**
 * Generate preview text from content (first 300 characters)
 */
function generatePreview(content: string): string {
  return content.substring(0, 300)
}

/**
 * GET /api/moments/[id]
 * Get a single moment by ID
 * Supports fields parameter: 'full' (default) or 'lightweight'
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Verify authentication
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await context.params
    const { searchParams } = new URL(request.url)
    const fields = searchParams.get('fields') || 'full'

    let query: string
    let result: any[]

    if (fields === 'lightweight') {
      // Lightweight mode: exclude content field
      query = `
        MATCH (m:Moment {id: $id, user_id: $userId})
        RETURN m.id as id,
               m.title as title,
               m.summary as summary,
               m.preview as preview,
               m.timestamp as timestamp,
               m.created_at as created_at,
               m.updated_at as updated_at
      `
      result = await executeUserQuery(query, { id }, session)
    } else {
      // Full mode: include everything and relationships
      query = `
        MATCH (m:Moment {id: $id, user_id: $userId})
        OPTIONAL MATCH (m)<-[:PARTICIPATED_IN]-(c:Character {user_id: $userId})
        OPTIONAL MATCH (m)-[:OCCURRED_AT]->(l:Location {user_id: $userId})
        RETURN m,
               collect(DISTINCT {id: c.id, name: c.name}) as characters,
               collect(DISTINCT {id: l.id, name: l.name}) as locations
      `
      const queryResult = await executeUserQuery(query, { id }, session)

      // Transform result to include relationships
      result = queryResult.map(record => {
        const moment = record.m || record
        const characters = record.characters?.filter((c: any) => c.id) || []
        const locations = record.locations?.filter((l: any) => l.id) || []

        return {
          ...moment,
          ...(characters.length > 0 && { characters }),
          ...(locations.length > 0 && { locations }),
        }
      })
    }

    if (!result || result.length === 0) {
      return NextResponse.json(
        { error: 'Moment not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ data: result[0] }, { status: 200 })
  } catch (error) {
    console.error('GET /api/moments/[id] error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch moment' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/moments/[id]
 * Update a moment (ownership verified)
 */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Verify authentication
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await context.params

    // Parse and validate request body
    let body
    try {
      body = await request.json()
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid JSON body' },
        { status: 400 }
      )
    }

    // Verify ownership
    const isOwner = await verifyNodeOwnership('Moment', id, session)
    if (!isOwner) {
      return NextResponse.json(
        { error: 'Moment not found or unauthorized' },
        { status: 404 }
      )
    }

    // Extract updatable fields
    const { title, content, summary, preview, timestamp } = body

    // Build dynamic SET clause based on provided fields
    const updates: string[] = []
    const params: Record<string, any> = { id }

    if (title !== undefined) {
      updates.push('m.title = $title')
      params.title = title
    }
    if (content !== undefined) {
      updates.push('m.content = $content')
      params.content = content

      // Auto-generate preview if content is updated and preview not explicitly provided
      if (preview === undefined) {
        updates.push('m.preview = $preview')
        params.preview = generatePreview(content)
      }
    }
    if (summary !== undefined) {
      updates.push('m.summary = $summary')
      params.summary = summary
    }
    if (preview !== undefined) {
      updates.push('m.preview = $preview')
      params.preview = preview
    }
    if (timestamp !== undefined) {
      updates.push('m.timestamp = $timestamp')
      params.timestamp = timestamp
    }

    // Always update updated_at
    updates.push('m.updated_at = datetime()')

    if (updates.length === 1) {
      // Only updated_at would be changed, meaning no actual updates
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      )
    }

    // Execute update
    const query = `
      MATCH (m:Moment {id: $id, user_id: $userId})
      SET ${updates.join(', ')}
      RETURN m
    `

    const result = await executeUserWrite(query, params, session)

    if (!result || result.length === 0) {
      return NextResponse.json(
        { error: 'Failed to update moment' },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: result[0] }, { status: 200 })
  } catch (error) {
    console.error('PATCH /api/moments/[id] error:', error)
    return NextResponse.json(
      { error: 'Failed to update moment' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/moments/[id]
 * Delete a moment and all its relationships (ownership verified)
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Verify authentication
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await context.params

    // Verify ownership
    const isOwner = await verifyNodeOwnership('Moment', id, session)
    if (!isOwner) {
      return NextResponse.json(
        { error: 'Moment not found or unauthorized' },
        { status: 404 }
      )
    }

    // Delete moment and all relationships
    // DETACH DELETE removes all relationships automatically
    const query = `
      MATCH (m:Moment {id: $id, user_id: $userId})
      DETACH DELETE m
    `

    await executeUserWrite(query, { id }, session)

    return NextResponse.json(
      { success: true, message: 'Moment deleted' },
      { status: 200 }
    )
  } catch (error) {
    console.error('DELETE /api/moments/[id] error:', error)
    return NextResponse.json(
      { error: 'Failed to delete moment' },
      { status: 500 }
    )
  }
}
