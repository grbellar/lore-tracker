/**
 * API Routes: /api/moments
 *
 * GET  - List all moments for authenticated user (lightweight, paginated)
 * POST - Create new moment for authenticated user
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth-config'
import { executeUserQuery, executeUserWrite } from '@/lib/neo4j-auth'
import { randomUUID } from 'crypto'

/**
 * Generate preview text from content (first 300 characters)
 */
function generatePreview(content: string): string {
  return content.substring(0, 300)
}

/**
 * GET /api/moments
 * List all moments for authenticated user (lightweight mode - excludes content)
 * Supports pagination via limit and skip parameters
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse query parameters for pagination
    const { searchParams } = new URL(request.url)
    const limit = Math.floor(parseInt(searchParams.get('limit') || '20', 10))
    const skip = Math.floor(parseInt(searchParams.get('skip') || '0', 10))

    // Query moments (lightweight - excludes content field)
    // Use toInteger() to ensure Neo4j receives integer values, not floats
    const query = `
      MATCH (m:Moment {user_id: $userId})
      RETURN m.id as id,
             m.title as title,
             m.preview as preview,
             m.summary as summary,
             m.timestamp as timestamp,
             m.created_at as created_at
      ORDER BY m.created_at DESC
      SKIP toInteger($skip)
      LIMIT toInteger($limit)
    `

    const moments = await executeUserQuery(query, { limit, skip }, session)

    return NextResponse.json({ data: moments }, { status: 200 })
  } catch (error) {
    console.error('GET /api/moments error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch moments' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/moments
 * Create a new moment for authenticated user
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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

    const { title, content, summary, preview, timestamp } = body

    // Validate that at least title or content is provided
    if ((!title || title.trim() === '') && (!content || content.trim() === '')) {
      return NextResponse.json(
        { error: 'Either title or content is required' },
        { status: 400 }
      )
    }

    // Generate preview if not provided
    const finalContent = content || ''
    const finalTitle = title || ''
    const finalPreview = preview || (finalContent ? generatePreview(finalContent) : '')

    // Generate unique ID
    const id = randomUUID()

    // Create moment in Neo4j
    const query = `
      CREATE (m:Moment {
        id: $id,
        user_id: $userId,
        title: $title,
        content: $content,
        summary: $summary,
        preview: $preview,
        timestamp: $timestamp,
        created_at: datetime(),
        updated_at: datetime()
      })
      RETURN m
    `

    const result = await executeUserWrite(
      query,
      {
        id,
        title: finalTitle.trim(),
        content: finalContent,
        summary: summary || null,
        preview: finalPreview,
        timestamp: timestamp || null,
      },
      session
    )

    if (!result || result.length === 0) {
      return NextResponse.json(
        { error: 'Failed to create moment' },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: result[0] }, { status: 201 })
  } catch (error) {
    console.error('POST /api/moments error:', error)
    return NextResponse.json(
      { error: 'Failed to create moment' },
      { status: 500 }
    )
  }
}
