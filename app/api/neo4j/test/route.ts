import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth-config'
import { verifyConnection } from '@/lib/neo4j'
import { executeUserQuery, executeUserWrite, getUserIdFromSession } from '@/lib/neo4j-auth'

/**
 * Test Neo4j connection and user isolation
 * GET /api/neo4j/test
 *
 * This endpoint demonstrates:
 * - Getting authenticated user from session
 * - Creating a test node with user isolation
 * - Querying user-specific data
 * - Cleaning up test data
 */
export async function GET() {
  try {
    // 1. Verify authentication
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized: No active session' },
        { status: 401 }
      )
    }

    // 2. Extract user ID
    const userId = getUserIdFromSession(session)

    // 3. Verify Neo4j connection
    const isConnected = await verifyConnection()
    if (!isConnected) {
      return NextResponse.json(
        { error: 'Neo4j connection failed' },
        { status: 500 }
      )
    }

    // 4. Create a test node with user isolation
    const testId = crypto.randomUUID()
    const createResult = await executeUserWrite(
      `CREATE (t:TestNode {
        id: $testId,
        user_id: $userId,
        name: $name,
        created_at: datetime()
      })
      RETURN t`,
      {
        testId,
        name: 'Test Node for ' + session.user.email,
      },
      session
    )

    // 5. Query user's test nodes (should only see their own)
    const userNodes = await executeUserQuery(
      'MATCH (t:TestNode {user_id: $userId}) RETURN t',
      {},
      session
    )

    // 6. Clean up test node
    await executeUserWrite(
      'MATCH (t:TestNode {id: $testId, user_id: $userId}) DELETE t',
      { testId },
      session
    )

    // 7. Return success response with test results
    return NextResponse.json({
      success: true,
      message: 'Neo4j integration test passed',
      data: {
        user: {
          id: userId,
          email: session.user.email,
          name: session.user.name,
        },
        neo4j_connection: 'success',
        test_node_created: createResult[0],
        user_nodes_count: userNodes.length,
        test_completed_at: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error('Neo4j test error:', error)

    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('Unauthorized')) {
        return NextResponse.json(
          { error: 'Unauthorized', details: error.message },
          { status: 401 }
        )
      }

      return NextResponse.json(
        {
          error: 'Neo4j test failed',
          details: error.message,
        },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: 'Unknown error occurred' },
      { status: 500 }
    )
  }
}

/**
 * Create a test character (example of write operation)
 * POST /api/neo4j/test
 *
 * Body: { "name": "Character Name", "description": "Optional description" }
 */
export async function POST(req: Request) {
  try {
    // 1. Verify authentication
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized: No active session' },
        { status: 401 }
      )
    }

    // 2. Parse request body
    const body = await req.json()
    const { name, description } = body

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      )
    }

    // 3. Create a test character with user isolation
    const characterId = crypto.randomUUID()
    const character = await executeUserWrite(
      `CREATE (c:Character {
        id: $id,
        user_id: $userId,
        name: $name,
        description: $description,
        created_at: datetime(),
        updated_at: datetime()
      })
      RETURN c`,
      {
        id: characterId,
        name,
        description: description || '',
      },
      session
    )

    return NextResponse.json(
      {
        success: true,
        message: 'Test character created',
        character: character[0],
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Character creation error:', error)

    if (error instanceof Error) {
      if (error.message.includes('Unauthorized')) {
        return NextResponse.json(
          { error: 'Unauthorized', details: error.message },
          { status: 401 }
        )
      }

      return NextResponse.json(
        {
          error: 'Character creation failed',
          details: error.message,
        },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: 'Unknown error occurred' },
      { status: 500 }
    )
  }
}

/**
 * Delete all test nodes for current user
 * DELETE /api/neo4j/test
 */
export async function DELETE() {
  try {
    // 1. Verify authentication
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized: No active session' },
        { status: 401 }
      )
    }

    // 2. Delete all TestNode entries for this user
    const result = await executeUserWrite(
      `MATCH (t:TestNode {user_id: $userId})
       DELETE t
       RETURN count(t) as deletedCount`,
      {},
      session
    )

    return NextResponse.json({
      success: true,
      message: 'Test nodes deleted',
      deleted_count: result[0]?.deletedCount || 0,
    })
  } catch (error) {
    console.error('Test nodes deletion error:', error)

    if (error instanceof Error) {
      return NextResponse.json(
        {
          error: 'Deletion failed',
          details: error.message,
        },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: 'Unknown error occurred' },
      { status: 500 }
    )
  }
}
