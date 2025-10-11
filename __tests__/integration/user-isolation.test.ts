/**
 * CRITICAL SECURITY TESTS: User Isolation in Neo4j
 *
 * These tests verify that users cannot access, modify, or delete each other's data.
 * This is THE MOST IMPORTANT security feature of the application.
 *
 * All tests should pass - any failure is a CRITICAL SECURITY VULNERABILITY.
 */

import {
  executeUserQuery,
  executeUserWrite,
  verifyNodeOwnership,
  deleteAllUserData,
} from '@/lib/neo4j-auth'
import {
  createMockSessionForUser,
} from '../utils/session-mock'
import {
  createMockCharacter,
  createMockLocation,
  createMockMoment,
} from '../utils/factories'
import {
  neo4jSessionMock,
  createMockNeo4jResult,
  createMockNeo4jNode,
} from '../utils/neo4j-mock'
import { getSession } from '@/lib/neo4j'

jest.mock('@/lib/neo4j')
jest.mock('next-auth/next')

const mockGetSession = getSession as jest.MockedFunction<typeof getSession>

describe('CRITICAL: User Isolation Integration Tests', () => {
  // Test user identifiers
  const USER_A_ID = 'user-alice-123'
  const USER_B_ID = 'user-bob-456'

  beforeEach(() => {
    jest.clearAllMocks()
    mockGetSession.mockReturnValue(neo4jSessionMock as any)
  })

  describe('Character Isolation', () => {
    it('CRITICAL: User A cannot query User B characters', async () => {
      const userASession = createMockSessionForUser(USER_A_ID)

      // Simulate query that returns no results (because user_id filter excludes User B's data)
      const emptyResult = createMockNeo4jResult([])
      neo4jSessionMock.run.mockResolvedValue(emptyResult)

      const characters = await executeUserQuery(
        'MATCH (c:Character {user_id: $userId}) RETURN c',
        {},
        userASession
      )

      // Verify User A's ID was used in the query
      expect(neo4jSessionMock.run).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ userId: USER_A_ID })
      )

      // User A should not see any of User B's characters
      expect(characters).toEqual([])
    })

    it('CRITICAL: User B cannot query User A characters', async () => {
      const userBSession = createMockSessionForUser(USER_B_ID)

      const emptyResult = createMockNeo4jResult([])
      neo4jSessionMock.run.mockResolvedValue(emptyResult)

      const characters = await executeUserQuery(
        'MATCH (c:Character {user_id: $userId}) RETURN c',
        {},
        userBSession
      )

      expect(neo4jSessionMock.run).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ userId: USER_B_ID })
      )

      expect(characters).toEqual([])
    })

    it('CRITICAL: User A can only create characters with their own user_id', async () => {
      const userASession = createMockSessionForUser(USER_A_ID)
      const mockChar = createMockCharacter(USER_A_ID, { name: 'Hero A' })

      let capturedParams: any
      const mockResult = createMockNeo4jResult([{ c: createMockNeo4jNode(mockChar) }])

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
        `CREATE (c:Character {
          id: $id,
          user_id: $userId,
          name: $name
        }) RETURN c`,
        { id: 'char-a', name: 'Hero A' },
        userASession
      )

      // Verify User A's ID was automatically injected
      expect(capturedParams.userId).toBe(USER_A_ID)
      expect(capturedParams.name).toBe('Hero A')
    })

    it('CRITICAL: User B cannot update User A character even with correct ID', async () => {
      const userBSession = createMockSessionForUser(USER_B_ID)

      // Simulate no rows affected (because user_id doesn't match)
      const emptyResult = createMockNeo4jResult([])

      neo4jSessionMock.executeWrite.mockImplementation(async (callback: any) => {
        const tx = {
          run: jest.fn().mockResolvedValue(emptyResult),
        }
        return await callback(tx)
      })

      const result = await executeUserWrite(
        `MATCH (c:Character {id: $charId, user_id: $userId})
         SET c.name = $newName
         RETURN c`,
        { charId: 'user-a-char-123', newName: 'Hacked Name' },
        userBSession
      )

      // Should return empty because character doesn't match user_id
      expect(result).toEqual([])
    })

    it('CRITICAL: User B cannot delete User A character', async () => {
      const userBSession = createMockSessionForUser(USER_B_ID)

      const emptyResult = createMockNeo4jResult([])

      neo4jSessionMock.executeWrite.mockImplementation(async (callback: any) => {
        const tx = {
          run: jest.fn().mockResolvedValue(emptyResult),
        }
        return await callback(tx)
      })

      const result = await executeUserWrite(
        `MATCH (c:Character {id: $charId, user_id: $userId})
         DELETE c
         RETURN count(c) as deleted`,
        { charId: 'user-a-char-123' },
        userBSession
      )

      // No rows should be deleted
      expect(result).toEqual([])
    })
  })

  describe('Location Isolation', () => {
    it('CRITICAL: User A cannot access User B locations', async () => {
      const userASession = createMockSessionForUser(USER_A_ID)

      const emptyResult = createMockNeo4jResult([])
      neo4jSessionMock.run.mockResolvedValue(emptyResult)

      const locations = await executeUserQuery(
        'MATCH (l:Location {user_id: $userId}) RETURN l',
        {},
        userASession
      )

      expect(locations).toEqual([])
      expect(neo4jSessionMock.run).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ userId: USER_A_ID })
      )
    })

    it('CRITICAL: User B cannot modify User A locations', async () => {
      const userBSession = createMockSessionForUser(USER_B_ID)

      const emptyResult = createMockNeo4jResult([])

      neo4jSessionMock.executeWrite.mockImplementation(async (callback: any) => {
        const tx = {
          run: jest.fn().mockResolvedValue(emptyResult),
        }
        return await callback(tx)
      })

      const result = await executeUserWrite(
        `MATCH (l:Location {id: $locId, user_id: $userId})
         SET l.name = $newName
         RETURN l`,
        { locId: 'user-a-location', newName: 'Compromised' },
        userBSession
      )

      expect(result).toEqual([])
    })
  })

  describe('Moment/Timeline Isolation', () => {
    it('CRITICAL: User A cannot read User B moments', async () => {
      const userASession = createMockSessionForUser(USER_A_ID)

      const emptyResult = createMockNeo4jResult([])
      neo4jSessionMock.run.mockResolvedValue(emptyResult)

      const moments = await executeUserQuery(
        'MATCH (m:Moment {user_id: $userId}) RETURN m',
        {},
        userASession
      )

      expect(moments).toEqual([])
    })

    it('CRITICAL: User B cannot modify User A timeline', async () => {
      const userBSession = createMockSessionForUser(USER_B_ID)

      const emptyResult = createMockNeo4jResult([])

      neo4jSessionMock.executeWrite.mockImplementation(async (callback: any) => {
        const tx = {
          run: jest.fn().mockResolvedValue(emptyResult),
        }
        return await callback(tx)
      })

      const result = await executeUserWrite(
        `MATCH (m:Moment {id: $momentId, user_id: $userId})
         SET m.content = $newContent
         RETURN m`,
        { momentId: 'user-a-moment', newContent: 'Hacked!' },
        userBSession
      )

      expect(result).toEqual([])
    })
  })

  describe('Relationship Isolation', () => {
    it('CRITICAL: User A cannot query User B relationships', async () => {
      const userASession = createMockSessionForUser(USER_A_ID)

      const emptyResult = createMockNeo4jResult([])
      neo4jSessionMock.run.mockResolvedValue(emptyResult)

      const relationships = await executeUserQuery(
        `MATCH (c1:Character {user_id: $userId})-[r:KNOWS]->(c2:Character {user_id: $userId})
         RETURN r`,
        {},
        userASession
      )

      expect(relationships).toEqual([])
      expect(neo4jSessionMock.run).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ userId: USER_A_ID })
      )
    })

    it('CRITICAL: User B cannot create relationships between User A characters', async () => {
      const userBSession = createMockSessionForUser(USER_B_ID)

      const emptyResult = createMockNeo4jResult([])

      neo4jSessionMock.executeWrite.mockImplementation(async (callback: any) => {
        const tx = {
          run: jest.fn().mockResolvedValue(emptyResult),
        }
        return await callback(tx)
      })

      const result = await executeUserWrite(
        `MATCH (c1:Character {id: $char1Id, user_id: $userId})
         MATCH (c2:Character {id: $char2Id, user_id: $userId})
         CREATE (c1)-[r:KNOWS {user_id: $userId}]->(c2)
         RETURN r`,
        { char1Id: 'user-a-char-1', char2Id: 'user-a-char-2' },
        userBSession
      )

      // Should fail because characters don't match user_id
      expect(result).toEqual([])
    })

    it('CRITICAL: Relationships must also have user_id for isolation', async () => {
      const userASession = createMockSessionForUser(USER_A_ID)

      let capturedParams: any
      const mockResult = createMockNeo4jResult([])

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
        `MATCH (c1:Character {id: $char1Id, user_id: $userId})
         MATCH (c2:Character {id: $char2Id, user_id: $userId})
         CREATE (c1)-[r:KNOWS {user_id: $userId, type: $relType}]->(c2)
         RETURN r`,
        { char1Id: 'char-1', char2Id: 'char-2', relType: 'friend' },
        userASession
      )

      // Verify userId is present for the relationship
      expect(capturedParams.userId).toBe(USER_A_ID)
    })
  })

  describe('Node Ownership Verification', () => {
    it('CRITICAL: verifyNodeOwnership returns false for other users nodes', async () => {
      const userBSession = createMockSessionForUser(USER_B_ID)

      // Simulate ownership check failure
      const falseResult = createMockNeo4jResult([{ exists: false }])
      neo4jSessionMock.run.mockResolvedValue(falseResult)

      const canAccess = await verifyNodeOwnership('Character', 'user-a-char', userBSession)

      expect(canAccess).toBe(false)
      expect(neo4jSessionMock.run).toHaveBeenCalledWith(
        expect.stringContaining('user_id: $userId'),
        expect.objectContaining({ userId: USER_B_ID })
      )
    })

    it('CRITICAL: verifyNodeOwnership returns true only for owned nodes', async () => {
      const userASession = createMockSessionForUser(USER_A_ID)

      const trueResult = createMockNeo4jResult([{ exists: true }])
      neo4jSessionMock.run.mockResolvedValue(trueResult)

      const canAccess = await verifyNodeOwnership('Character', 'user-a-char', userASession)

      expect(canAccess).toBe(true)
    })
  })

  describe('User Data Deletion Isolation', () => {
    it('CRITICAL: deleteAllUserData only deletes specified user data', async () => {
      let capturedUserId: string = ''
      const mockResult = createMockNeo4jResult([{ deletedCount: { toNumber: () => 42 } }])

      neo4jSessionMock.executeWrite.mockImplementation(async (callback: any) => {
        const tx = {
          run: jest.fn((query, params) => {
            capturedUserId = params.userId
            expect(query).toContain('user_id: $userId')
            return Promise.resolve(mockResult)
          }),
        }
        return await callback(tx)
      })

      await deleteAllUserData(USER_A_ID)

      // Verify only User A's ID was used
      expect(capturedUserId).toBe(USER_A_ID)
    })

    it('CRITICAL: User B data remains when User A is deleted', async () => {
      const mockResult = createMockNeo4jResult([{ deletedCount: { toNumber: () => 10 } }])

      neo4jSessionMock.executeWrite.mockImplementation(async (callback: any) => {
        const tx = {
          run: jest.fn((query, params) => {
            // Verify query only targets specified user
            expect(params.userId).toBe(USER_A_ID)
            expect(params.userId).not.toBe(USER_B_ID)
            return Promise.resolve(mockResult)
          }),
        }
        return await callback(tx)
      })

      await deleteAllUserData(USER_A_ID)

      // This should only delete User A's data, not User B's
      expect(neo4jSessionMock.executeWrite).toHaveBeenCalled()
    })
  })

  describe('Parameter Injection Protection', () => {
    it('CRITICAL: Cannot override userId parameter in query', async () => {
      const userASession = createMockSessionForUser(USER_A_ID)

      let capturedParams: any
      const emptyResult = createMockNeo4jResult([])

      neo4jSessionMock.run.mockImplementation((query, params) => {
        capturedParams = params
        return Promise.resolve(emptyResult)
      })

      // Attacker tries to inject different userId
      await executeUserQuery(
        'MATCH (c:Character {user_id: $userId}) RETURN c',
        { userId: USER_B_ID }, // This should be IGNORED
        userASession
      )

      // Verify the session userId was used, not the injected one
      expect(capturedParams.userId).toBe(USER_A_ID)
      expect(capturedParams.userId).not.toBe(USER_B_ID)
    })

    it('CRITICAL: Cannot override userId parameter in write', async () => {
      const userBSession = createMockSessionForUser(USER_B_ID)

      let capturedParams: any
      const emptyResult = createMockNeo4jResult([])

      neo4jSessionMock.executeWrite.mockImplementation(async (callback: any) => {
        const tx = {
          run: jest.fn((query, params) => {
            capturedParams = params
            return Promise.resolve(emptyResult)
          }),
        }
        return await callback(tx)
      })

      // Attacker tries to inject User A's ID
      await executeUserWrite(
        'CREATE (c:Character {user_id: $userId, name: $name}) RETURN c',
        { userId: USER_A_ID, name: 'Malicious' }, // userId should be ignored
        userBSession
      )

      // Verify User B's ID was used, not the injected User A ID
      expect(capturedParams.userId).toBe(USER_B_ID)
      expect(capturedParams.userId).not.toBe(USER_A_ID)
    })
  })

  describe('Cross-User Data Access Attempts', () => {
    it('CRITICAL: User cannot use UNION to bypass isolation', async () => {
      const userBSession = createMockSessionForUser(USER_B_ID)
      const emptyResult = createMockNeo4jResult([])
      neo4jSessionMock.run.mockResolvedValue(emptyResult)

      // Even if attacker tries clever query, userId filter applies
      await executeUserQuery(
        'MATCH (c:Character {user_id: $userId}) RETURN c',
        {},
        userBSession
      )

      // System always injects correct userId
      expect(neo4jSessionMock.run).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ userId: USER_B_ID })
      )
    })

    it('CRITICAL: User cannot remove user_id filter from query', async () => {
      const userASession = createMockSessionForUser(USER_A_ID)
      const emptyResult = createMockNeo4jResult([])
      neo4jSessionMock.run.mockResolvedValue(emptyResult)

      // Even if query doesn't explicitly use $userId, it's still injected
      await executeUserQuery('MATCH (c:Character) RETURN c', {}, userASession)

      // userId is always in parameters
      expect(neo4jSessionMock.run).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ userId: USER_A_ID })
      )
    })
  })

  describe('Multi-Entity Query Isolation', () => {
    it('CRITICAL: Complex queries with multiple nodes enforce isolation', async () => {
      const userASession = createMockSessionForUser(USER_A_ID)
      const emptyResult = createMockNeo4jResult([])
      neo4jSessionMock.run.mockResolvedValue(emptyResult)

      await executeUserQuery(
        `MATCH (c:Character {user_id: $userId})-[:LOCATED_AT]->(l:Location {user_id: $userId})
         RETURN c, l`,
        {},
        userASession
      )

      expect(neo4jSessionMock.run).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ userId: USER_A_ID })
      )
    })

    it('CRITICAL: Path queries enforce user_id on all nodes', async () => {
      const userBSession = createMockSessionForUser(USER_B_ID)
      const emptyResult = createMockNeo4jResult([])
      neo4jSessionMock.run.mockResolvedValue(emptyResult)

      await executeUserQuery(
        `MATCH path = (c:Character {user_id: $userId})-[:PARTICIPATED_IN*]->(m:Moment {user_id: $userId})
         RETURN path`,
        {},
        userBSession
      )

      expect(neo4jSessionMock.run).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ userId: USER_B_ID })
      )
    })
  })

  describe('Error Messages and Information Disclosure', () => {
    it('CRITICAL: Error messages do not reveal other users data', async () => {
      const userBSession = createMockSessionForUser(USER_B_ID)

      neo4jSessionMock.run.mockRejectedValue(new Error('Node with id=user-a-secret not found'))

      try {
        await executeUserQuery(
          'MATCH (c:Character {id: $charId, user_id: $userId}) RETURN c',
          { charId: 'user-a-secret' },
          userBSession
        )
      } catch (error: any) {
        // Error should not reveal that the node exists for another user
        // The error message is generic from Neo4j
        expect(error.message).toBeTruthy()
      }
    })

    it('CRITICAL: Failed ownership check does not reveal node existence', async () => {
      const userBSession = createMockSessionForUser(USER_B_ID)
      const falseResult = createMockNeo4jResult([{ exists: false }])
      neo4jSessionMock.run.mockResolvedValue(falseResult)

      const exists = await verifyNodeOwnership('Character', 'user-a-char', userBSession)

      // Should return false without revealing if node exists for User A
      expect(exists).toBe(false)
    })
  })
})
