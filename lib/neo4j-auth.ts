import { Session } from 'next-auth'
import { getServerSession } from 'next-auth/next'
import { getSession, Session as Neo4jSession } from './neo4j'

/**
 * Extract user ID from NextAuth session
 * @param session - NextAuth session object
 * @returns User ID string
 * @throws Error if session is invalid or user ID is missing
 */
export function getUserIdFromSession(session: Session | null): string {
  if (!session || !session.user || !session.user.id) {
    throw new Error('Unauthorized: No valid session or user ID')
  }
  return session.user.id
}

/**
 * Get authenticated user ID from current server session
 * Convenience function that combines getServerSession and getUserIdFromSession
 * @returns Promise<string> - The authenticated user's ID
 * @throws Error if not authenticated
 */
export async function getAuthenticatedUserId(): Promise<string> {
  const session = await getServerSession()
  return getUserIdFromSession(session)
}

/**
 * Execute a Neo4j query with automatic user isolation
 * Automatically injects the user_id parameter into the query
 *
 * @param query - Cypher query string (should use $userId parameter)
 * @param params - Additional query parameters (userId will be added automatically)
 * @param session - Optional NextAuth session (will fetch if not provided)
 * @returns Promise<any[]> - Array of record results
 *
 * @example
 * const characters = await executeUserQuery(
 *   'MATCH (c:Character {user_id: $userId}) RETURN c',
 *   {}
 * )
 */
export async function executeUserQuery<T = any>(
  query: string,
  params: Record<string, any> = {},
  session?: Session | null
): Promise<T[]> {
  // Get session if not provided
  const authSession = session ?? await getServerSession()
  const userId = getUserIdFromSession(authSession)

  // Get Neo4j session
  const neo4jSession: Neo4jSession = getSession()

  try {
    // Execute query with userId automatically injected
    const result = await neo4jSession.run(query, {
      ...params,
      userId, // Always include userId for data isolation
    })

    // Extract and return records
    return result.records.map(record => {
      // If single field, return that field directly
      if (record.keys.length === 1) {
        const value = record.get(record.keys[0])
        return value?.properties || value
      }

      // If multiple fields, return object with all fields
      const obj: any = {}
      record.keys.forEach(key => {
        const value = record.get(key)
        obj[key] = value?.properties || value
      })
      return obj
    })
  } catch (error) {
    console.error('Neo4j query execution failed:', error)
    throw error
  } finally {
    await neo4jSession.close()
  }
}

/**
 * Execute a Neo4j write transaction with automatic user isolation
 * Use this for CREATE, UPDATE, DELETE operations
 *
 * @param query - Cypher query string (should use $userId parameter)
 * @param params - Additional query parameters (userId will be added automatically)
 * @param session - Optional NextAuth session (will fetch if not provided)
 * @returns Promise<T[]> - Array of record results
 *
 * @example
 * const newCharacter = await executeUserWrite(
 *   `CREATE (c:Character {
 *     id: $id,
 *     user_id: $userId,
 *     name: $name,
 *     created_at: datetime(),
 *     updated_at: datetime()
 *   }) RETURN c`,
 *   { id: crypto.randomUUID(), name: 'Luke Skywalker' }
 * )
 */
export async function executeUserWrite<T = any>(
  query: string,
  params: Record<string, any> = {},
  session?: Session | null
): Promise<T[]> {
  // Get session if not provided
  const authSession = session ?? await getServerSession()
  const userId = getUserIdFromSession(authSession)

  // Get Neo4j session with write mode
  const neo4jSession: Neo4jSession = getSession()

  try {
    // Execute write query within a transaction
    const result = await neo4jSession.executeWrite(async tx => {
      return await tx.run(query, {
        ...params,
        userId, // Always include userId for data isolation
      })
    })

    // Extract and return records
    return result.records.map(record => {
      // If single field, return that field directly
      if (record.keys.length === 1) {
        const value = record.get(record.keys[0])
        return value?.properties || value
      }

      // If multiple fields, return object with all fields
      const obj: any = {}
      record.keys.forEach(key => {
        const value = record.get(key)
        obj[key] = value?.properties || value
      })
      return obj
    })
  } catch (error) {
    console.error('Neo4j write transaction failed:', error)
    throw error
  } finally {
    await neo4jSession.close()
  }
}

/**
 * Verify that a specific node belongs to the authenticated user
 * Used before update/delete operations to ensure ownership
 *
 * @param nodeLabel - Node label (e.g., 'Character', 'Location')
 * @param nodeId - Node ID to verify
 * @param session - Optional NextAuth session (will fetch if not provided)
 * @returns Promise<boolean> - True if user owns the node
 *
 * @example
 * const canEdit = await verifyNodeOwnership('Character', characterId)
 * if (!canEdit) {
 *   throw new Error('Unauthorized')
 * }
 */
export async function verifyNodeOwnership(
  nodeLabel: string,
  nodeId: string,
  session?: Session | null
): Promise<boolean> {
  const authSession = session ?? await getServerSession()
  const userId = getUserIdFromSession(authSession)

  const neo4jSession: Neo4jSession = getSession()

  try {
    const result = await neo4jSession.run(
      `MATCH (n:${nodeLabel} {id: $nodeId, user_id: $userId})
       RETURN count(n) > 0 as exists`,
      { nodeId, userId }
    )

    return result.records[0]?.get('exists') || false
  } catch (error) {
    console.error('Node ownership verification failed:', error)
    return false
  } finally {
    await neo4jSession.close()
  }
}

/**
 * Delete all Neo4j data for a specific user
 * Use this when deleting a user account
 * WARNING: This is irreversible!
 *
 * @param userId - User ID to delete data for
 * @returns Promise<number> - Number of nodes deleted
 */
export async function deleteAllUserData(userId: string): Promise<number> {
  const neo4jSession: Neo4jSession = getSession()

  try {
    const result = await neo4jSession.executeWrite(async tx => {
      return await tx.run(
        `MATCH (n {user_id: $userId})
         DETACH DELETE n
         RETURN count(n) as deletedCount`,
        { userId }
      )
    })

    return result.records[0]?.get('deletedCount').toNumber() || 0
  } catch (error) {
    console.error('User data deletion failed:', error)
    throw error
  } finally {
    await neo4jSession.close()
  }
}
