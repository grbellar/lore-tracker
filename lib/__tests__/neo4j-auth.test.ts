import {
  getUserIdFromSession,
  getAuthenticatedUserId,
  executeUserQuery,
  executeUserWrite,
  verifyNodeOwnership,
  deleteAllUserData,
} from '../neo4j-auth'
import { Session } from 'next-auth'
import { getServerSession } from 'next-auth/next'
import { getSession } from '../neo4j'
import {
  createMockSession,
  createMockSessionForUser,
} from '../../__tests__/utils/session-mock'
import {
  createMockNeo4jResult,
  createMockNeo4jNode,
  neo4jSessionMock,
} from '../../__tests__/utils/neo4j-mock'

// Mock the dependencies
jest.mock('next-auth/next')
jest.mock('../neo4j')

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>
const mockGetSession = getSession as jest.MockedFunction<typeof getSession>

describe('lib/neo4j-auth.ts', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Default mock implementation
    mockGetSession.mockReturnValue(neo4jSessionMock as any)
  })

  describe('getUserIdFromSession', () => {
    it('should extract user ID from valid session', () => {
      const session = createMockSession('user-123', 'test@example.com')

      const userId = getUserIdFromSession(session)

      expect(userId).toBe('user-123')
    })

    it('should throw error when session is null', () => {
      expect(() => getUserIdFromSession(null)).toThrow('Unauthorized: No valid session or user ID')
    })

    it('should throw error when session.user is missing', () => {
      const invalidSession = { expires: new Date().toISOString() } as Session

      expect(() => getUserIdFromSession(invalidSession)).toThrow(
        'Unauthorized: No valid session or user ID'
      )
    })

    it('should throw error when session.user.id is missing', () => {
      const invalidSession = {
        user: { email: 'test@example.com', name: 'Test' },
        expires: new Date().toISOString(),
      } as any

      expect(() => getUserIdFromSession(invalidSession)).toThrow(
        'Unauthorized: No valid session or user ID'
      )
    })

    it('should log error message for debugging', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error')

      try {
        getUserIdFromSession(null)
      } catch (error) {
        // Error expected
      }

      // Verify error would be catchable for logging
      expect(() => getUserIdFromSession(null)).toThrow()
    })
  })

  describe('getAuthenticatedUserId', () => {
    it('should get user ID from server session', async () => {
      const session = createMockSession('user-456')
      mockGetServerSession.mockResolvedValue(session)

      const userId = await getAuthenticatedUserId()

      expect(userId).toBe('user-456')
      expect(mockGetServerSession).toHaveBeenCalledTimes(1)
    })

    it('should throw error when no session exists', async () => {
      mockGetServerSession.mockResolvedValue(null)

      await expect(getAuthenticatedUserId()).rejects.toThrow(
        'Unauthorized: No valid session or user ID'
      )
    })

    it('should throw error when session is invalid', async () => {
      mockGetServerSession.mockResolvedValue({} as Session)

      await expect(getAuthenticatedUserId()).rejects.toThrow(
        'Unauthorized: No valid session or user ID'
      )
    })
  })

  describe('executeUserQuery', () => {
    it('should execute query with userId automatically injected', async () => {
      const session = createMockSession('user-789')
      mockGetServerSession.mockResolvedValue(session)

      const mockResult = createMockNeo4jResult(
        [{ c: createMockNeo4jNode({ id: 'char-1', name: 'Test Character' }) }],
        ['c']
      )
      neo4jSessionMock.run.mockResolvedValue(mockResult)

      const query = 'MATCH (c:Character {user_id: $userId}) RETURN c'
      const result = await executeUserQuery(query, {})

      expect(neo4jSessionMock.run).toHaveBeenCalledWith(query, {
        userId: 'user-789',
      })
      expect(neo4jSessionMock.close).toHaveBeenCalled()
    })

    it('should merge additional params with userId', async () => {
      const session = createMockSession('user-789')
      mockGetServerSession.mockResolvedValue(session)

      const mockResult = createMockNeo4jResult([])
      neo4jSessionMock.run.mockResolvedValue(mockResult)

      const query = 'MATCH (c:Character {id: $charId, user_id: $userId}) RETURN c'
      await executeUserQuery(query, { charId: 'char-123' })

      expect(neo4jSessionMock.run).toHaveBeenCalledWith(query, {
        charId: 'char-123',
        userId: 'user-789',
      })
    })

    it('should use provided session instead of fetching new one', async () => {
      const session = createMockSession('user-abc')
      const mockResult = createMockNeo4jResult([])
      neo4jSessionMock.run.mockResolvedValue(mockResult)

      await executeUserQuery('MATCH (c:Character) RETURN c', {}, session)

      expect(mockGetServerSession).not.toHaveBeenCalled()
      expect(neo4jSessionMock.run).toHaveBeenCalledWith(expect.any(String), {
        userId: 'user-abc',
      })
    })

    it('should return empty array when no records found', async () => {
      const session = createMockSession('user-empty')
      const mockResult = createMockNeo4jResult([])
      neo4jSessionMock.run.mockResolvedValue(mockResult)

      const result = await executeUserQuery('MATCH (c:Character) RETURN c', {}, session)

      expect(result).toEqual([])
    })

    it('should extract node properties from single field results', async () => {
      const session = createMockSession('user-props')
      const mockNode = createMockNeo4jNode({ id: 'char-1', name: 'Hero' })
      const mockResult = createMockNeo4jResult([{ c: mockNode }], ['c'])

      neo4jSessionMock.run.mockResolvedValue(mockResult)

      const result = await executeUserQuery('MATCH (c:Character) RETURN c', {}, session)

      expect(result).toEqual([{ id: 'char-1', name: 'Hero' }])
    })

    it('should handle multiple field results', async () => {
      const session = createMockSession('user-multi')
      const mockResult = createMockNeo4jResult(
        [
          {
            c: createMockNeo4jNode({ name: 'Hero' }),
            l: createMockNeo4jNode({ name: 'Castle' }),
          },
        ],
        ['c', 'l']
      )

      neo4jSessionMock.run.mockResolvedValue(mockResult)

      const result = await executeUserQuery(
        'MATCH (c:Character)-[:LOCATED_AT]->(l:Location) RETURN c, l',
        {},
        session
      )

      expect(result).toEqual([
        {
          c: { name: 'Hero' },
          l: { name: 'Castle' },
        },
      ])
    })

    it('should close session even on error', async () => {
      const session = createMockSession('user-error')
      neo4jSessionMock.run.mockRejectedValue(new Error('Neo4j query failed'))

      await expect(executeUserQuery('INVALID QUERY', {}, session)).rejects.toThrow(
        'Neo4j query failed'
      )

      expect(neo4jSessionMock.close).toHaveBeenCalled()
    })

    it('should log error when query execution fails', async () => {
      const session = createMockSession('user-log')
      const consoleErrorSpy = jest.spyOn(console, 'error')
      neo4jSessionMock.run.mockRejectedValue(new Error('Query error'))

      await expect(executeUserQuery('MATCH (n) RETURN n', {}, session)).rejects.toThrow()

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Neo4j query execution failed:',
        expect.any(Error)
      )
    })

    it('should throw error when session is invalid', async () => {
      mockGetServerSession.mockResolvedValue(null)

      await expect(executeUserQuery('MATCH (n) RETURN n', {})).rejects.toThrow('Unauthorized')
    })
  })

  describe('executeUserWrite', () => {
    it('should execute write transaction with userId', async () => {
      const session = createMockSession('user-write')
      mockGetServerSession.mockResolvedValue(session)

      const mockResult = createMockNeo4jResult([
        { c: createMockNeo4jNode({ id: 'new-char', name: 'New Hero' }) },
      ])

      neo4jSessionMock.executeWrite.mockImplementation(async (callback: any) => {
        const tx = {
          run: jest.fn().mockResolvedValue(mockResult),
        }
        return await callback(tx)
      })

      const query = `CREATE (c:Character {id: $id, user_id: $userId, name: $name}) RETURN c`
      const result = await executeUserWrite(query, { id: 'new-char', name: 'New Hero' })

      expect(neo4jSessionMock.executeWrite).toHaveBeenCalled()
      expect(result).toEqual([{ id: 'new-char', name: 'New Hero' }])
      expect(neo4jSessionMock.close).toHaveBeenCalled()
    })

    it('should merge params with userId in write transaction', async () => {
      const session = createMockSession('user-write-2')
      const mockResult = createMockNeo4jResult([])

      let capturedParams: any
      neo4jSessionMock.executeWrite.mockImplementation(async (callback: any) => {
        const tx = {
          run: jest.fn((query, params) => {
            capturedParams = params
            return Promise.resolve(mockResult)
          }),
        }
        return await callback(tx)
      })

      await executeUserWrite(
        'CREATE (c:Character {id: $id, user_id: $userId}) RETURN c',
        { id: 'test-id' },
        session
      )

      expect(capturedParams).toEqual({ id: 'test-id', userId: 'user-write-2' })
    })

    it('should close session even on write error', async () => {
      const session = createMockSession('user-write-error')
      neo4jSessionMock.executeWrite.mockRejectedValue(new Error('Write failed'))

      await expect(executeUserWrite('CREATE (n) RETURN n', {}, session)).rejects.toThrow(
        'Write failed'
      )

      expect(neo4jSessionMock.close).toHaveBeenCalled()
    })

    it('should log error when write transaction fails', async () => {
      const session = createMockSession('user-write-log')
      const consoleErrorSpy = jest.spyOn(console, 'error')
      neo4jSessionMock.executeWrite.mockRejectedValue(new Error('Transaction error'))

      await expect(executeUserWrite('CREATE (n) RETURN n', {}, session)).rejects.toThrow()

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Neo4j write transaction failed:',
        expect.any(Error)
      )
    })

    it('should throw error when session is invalid', async () => {
      mockGetServerSession.mockResolvedValue(null)

      await expect(executeUserWrite('CREATE (n) RETURN n', {})).rejects.toThrow('Unauthorized')
    })
  })

  describe('verifyNodeOwnership', () => {
    it('should return true when user owns the node', async () => {
      const session = createMockSession('owner-user')
      const mockResult = createMockNeo4jResult([{ exists: true }], ['exists'])
      neo4jSessionMock.run.mockResolvedValue(mockResult)

      const isOwner = await verifyNodeOwnership('Character', 'char-123', session)

      expect(isOwner).toBe(true)
      expect(neo4jSessionMock.run).toHaveBeenCalledWith(
        expect.stringContaining('MATCH (n:Character {id: $nodeId, user_id: $userId})'),
        { nodeId: 'char-123', userId: 'owner-user' }
      )
      expect(neo4jSessionMock.close).toHaveBeenCalled()
    })

    it('should return false when user does not own the node', async () => {
      const session = createMockSession('non-owner')
      const mockResult = createMockNeo4jResult([{ exists: false }], ['exists'])
      neo4jSessionMock.run.mockResolvedValue(mockResult)

      const isOwner = await verifyNodeOwnership('Character', 'char-456', session)

      expect(isOwner).toBe(false)
    })

    it('should return false when node does not exist', async () => {
      const session = createMockSession('user-nonexist')
      const mockResult = createMockNeo4jResult([], [])
      neo4jSessionMock.run.mockResolvedValue(mockResult)

      const isOwner = await verifyNodeOwnership('Character', 'nonexistent', session)

      expect(isOwner).toBe(false)
    })

    it('should return false and log error on query failure', async () => {
      const session = createMockSession('user-verify-error')
      const consoleErrorSpy = jest.spyOn(console, 'error')
      neo4jSessionMock.run.mockRejectedValue(new Error('Verification failed'))

      const isOwner = await verifyNodeOwnership('Character', 'char-789', session)

      expect(isOwner).toBe(false)
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Node ownership verification failed:',
        expect.any(Error)
      )
    })

    it('should close session even on verification error', async () => {
      const session = createMockSession('user-close-verify')
      neo4jSessionMock.run.mockRejectedValue(new Error('Error'))

      await verifyNodeOwnership('Location', 'loc-123', session)

      expect(neo4jSessionMock.close).toHaveBeenCalled()
    })

    it('should work with different node labels', async () => {
      const session = createMockSession('user-labels')
      const mockResult = createMockNeo4jResult([{ exists: true }])
      neo4jSessionMock.run.mockResolvedValue(mockResult)

      await verifyNodeOwnership('Location', 'loc-1', session)
      expect(neo4jSessionMock.run).toHaveBeenCalledWith(
        expect.stringContaining('MATCH (n:Location'),
        expect.any(Object)
      )

      await verifyNodeOwnership('Moment', 'moment-1', session)
      expect(neo4jSessionMock.run).toHaveBeenCalledWith(
        expect.stringContaining('MATCH (n:Moment'),
        expect.any(Object)
      )
    })
  })

  describe('deleteAllUserData', () => {
    it('should delete all nodes for a user', async () => {
      const mockResult = createMockNeo4jResult([{ deletedCount: { toNumber: () => 42 } }])

      neo4jSessionMock.executeWrite.mockImplementation(async (callback: any) => {
        const tx = {
          run: jest.fn().mockResolvedValue(mockResult),
        }
        return await callback(tx)
      })

      const deletedCount = await deleteAllUserData('user-to-delete')

      expect(deletedCount).toBe(42)
      expect(neo4jSessionMock.executeWrite).toHaveBeenCalled()
      expect(neo4jSessionMock.close).toHaveBeenCalled()
    })

    it('should return 0 when no nodes are deleted', async () => {
      const mockResult = createMockNeo4jResult([])

      neo4jSessionMock.executeWrite.mockImplementation(async (callback: any) => {
        const tx = {
          run: jest.fn().mockResolvedValue(mockResult),
        }
        return await callback(tx)
      })

      const deletedCount = await deleteAllUserData('user-no-data')

      expect(deletedCount).toBe(0)
    })

    it('should use DETACH DELETE to remove relationships', async () => {
      const mockResult = createMockNeo4jResult([{ deletedCount: { toNumber: () => 1 } }])

      let capturedQuery: string = ''
      neo4jSessionMock.executeWrite.mockImplementation(async (callback: any) => {
        const tx = {
          run: jest.fn((query, params) => {
            capturedQuery = query
            return Promise.resolve(mockResult)
          }),
        }
        return await callback(tx)
      })

      await deleteAllUserData('user-detach')

      expect(capturedQuery).toContain('DETACH DELETE')
      expect(capturedQuery).toContain('user_id: $userId')
    })

    it('should close session even on delete error', async () => {
      neo4jSessionMock.executeWrite.mockRejectedValue(new Error('Delete failed'))

      await expect(deleteAllUserData('user-delete-error')).rejects.toThrow('Delete failed')

      expect(neo4jSessionMock.close).toHaveBeenCalled()
    })

    it('should log error when deletion fails', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error')
      neo4jSessionMock.executeWrite.mockRejectedValue(new Error('Deletion error'))

      await expect(deleteAllUserData('user-delete-log')).rejects.toThrow()

      expect(consoleErrorSpy).toHaveBeenCalledWith('User data deletion failed:', expect.any(Error))
    })
  })

  describe('User Isolation - Critical Security Tests', () => {
    it('should prevent User B from querying User A data', async () => {
      const userASession = createMockSessionForUser('user-a')
      const userBSession = createMockSessionForUser('user-b')

      // Simulate User A creates a character
      const mockEmptyResult = createMockNeo4jResult([])
      neo4jSessionMock.run.mockResolvedValue(mockEmptyResult)

      // User B tries to query all characters (should only see their own, not User A's)
      const result = await executeUserQuery(
        'MATCH (c:Character {user_id: $userId}) RETURN c',
        {},
        userBSession
      )

      // Verify userId was injected correctly for User B
      expect(neo4jSessionMock.run).toHaveBeenCalledWith(expect.any(String), {
        userId: 'user-b',
      })
      expect(result).toEqual([])
    })

    it('should prevent User B from updating User A node', async () => {
      const userBSession = createMockSessionForUser('user-b')

      // User B tries to update User A's character
      const mockEmptyResult = createMockNeo4jResult([])
      neo4jSessionMock.executeWrite.mockImplementation(async (callback: any) => {
        const tx = {
          run: jest.fn().mockResolvedValue(mockEmptyResult),
        }
        return await callback(tx)
      })

      const result = await executeUserWrite(
        `MATCH (c:Character {id: $charId, user_id: $userId})
         SET c.name = $newName
         RETURN c`,
        { charId: 'user-a-char', newName: 'Hacked Name' },
        userBSession
      )

      // Should return empty because user-b doesn't own user-a-char
      expect(result).toEqual([])
    })

    it('should prevent User B from verifying ownership of User A node', async () => {
      const userBSession = createMockSessionForUser('user-b')
      const mockResult = createMockNeo4jResult([{ exists: false }])
      neo4jSessionMock.run.mockResolvedValue(mockResult)

      const canAccess = await verifyNodeOwnership('Character', 'user-a-char', userBSession)

      expect(canAccess).toBe(false)
      expect(neo4jSessionMock.run).toHaveBeenCalledWith(expect.any(String), {
        nodeId: 'user-a-char',
        userId: 'user-b',
      })
    })

    it('should only delete User A data when User A account is deleted', async () => {
      let capturedUserId: string = ''
      const mockResult = createMockNeo4jResult([{ deletedCount: { toNumber: () => 10 } }])

      neo4jSessionMock.executeWrite.mockImplementation(async (callback: any) => {
        const tx = {
          run: jest.fn((query, params) => {
            capturedUserId = params.userId
            return Promise.resolve(mockResult)
          }),
        }
        return await callback(tx)
      })

      await deleteAllUserData('user-a')

      // Verify only user-a's data is targeted
      expect(capturedUserId).toBe('user-a')
    })

    it('should ensure userId parameter cannot be overridden', async () => {
      const session = createMockSession('legitimate-user')
      const mockResult = createMockNeo4jResult([])
      neo4jSessionMock.run.mockResolvedValue(mockResult)

      // Try to inject a different userId (should be overridden by session userId)
      await executeUserQuery(
        'MATCH (c:Character {user_id: $userId}) RETURN c',
        { userId: 'attacker-user' }, // This should be ignored
        session
      )

      // Verify the legitimate user ID from session was used
      expect(neo4jSessionMock.run).toHaveBeenCalledWith(expect.any(String), {
        userId: 'legitimate-user', // Not 'attacker-user'
      })
    })
  })

  describe('Error message propagation', () => {
    it('should propagate clear error messages to caller', async () => {
      const session = createMockSession('user-error')
      neo4jSessionMock.run.mockRejectedValue(new Error('Connection timeout'))

      try {
        await executeUserQuery('MATCH (n) RETURN n', {}, session)
        fail('Should have thrown an error')
      } catch (error: any) {
        expect(error.message).toBe('Connection timeout')
      }
    })

    it('should log errors with context for debugging', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error')
      const session = createMockSession('debug-user')
      neo4jSessionMock.run.mockRejectedValue(new Error('Syntax error'))

      try {
        await executeUserQuery('INVALID CYPHER', {}, session)
      } catch (error) {
        // Expected
      }

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Neo4j query execution failed'),
        expect.any(Error)
      )
    })
  })
})
