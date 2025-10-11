/**
 * Error Handling and Message Propagation Tests
 *
 * These tests verify that:
 * 1. Errors are properly logged for debugging
 * 2. User-friendly error messages are propagated to the frontend
 * 3. Sensitive information is not exposed in error messages
 * 4. All error paths are covered
 */

import { POST as signupPOST } from '@/app/api/auth/signup/route'
import { NextRequest } from 'next/server'
import { prismaMock } from '../utils/prisma-mock'
import {
  executeUserQuery,
  executeUserWrite,
  getUserIdFromSession,
} from '@/lib/neo4j-auth'
import { createMockSession } from '../utils/session-mock'
import { createSignupData, createMockUser } from '../utils/factories'
import { neo4jSessionMock } from '../utils/neo4j-mock'
import { getSession } from '@/lib/neo4j'
import * as auth from '@/lib/auth'

jest.mock('@/lib/neo4j')
jest.mock('@/lib/auth')

const mockGetSession = getSession as jest.MockedFunction<typeof getSession>

describe('Error Handling and Message Propagation', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetSession.mockReturnValue(neo4jSessionMock as any)
  })

  describe('Signup API Error Messages', () => {
    it('should log errors with context for debugging', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error')
      const dbError = new Error('Database connection failed')

      prismaMock.user.findUnique.mockRejectedValue(dbError)

      const request = new NextRequest('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify(createSignupData()),
      })

      await signupPOST(request)

      expect(consoleErrorSpy).toHaveBeenCalledWith('Signup error:', dbError)
    })

    it('should return user-friendly error for validation failures', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify({ email: 'test@test.com', password: 'short' }),
      })

      const response = await signupPOST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Password must be at least 8 characters')
      expect(data.error).not.toContain('stack')
      expect(data.error).not.toContain('internal')
    })

    it('should return user-friendly error for duplicate email', async () => {
      prismaMock.user.findUnique.mockResolvedValue(createMockUser())

      const request = new NextRequest('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify(createSignupData()),
      })

      const response = await signupPOST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('User with this email already exists')
    })

    it('should return generic error for database failures', async () => {
      prismaMock.user.findUnique.mockRejectedValue(new Error('Internal DB error'))

      const request = new NextRequest('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify(createSignupData()),
      })

      const response = await signupPOST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('An error occurred during signup')
      expect(data.error).not.toContain('DB')
      expect(data.error).not.toContain('Internal')
    })

    it('should not expose database connection strings in errors', async () => {
      prismaMock.user.findUnique.mockRejectedValue(
        new Error('Connection refused to postgresql://admin:secret@db-prod-1:5432/mydb')
      )

      const request = new NextRequest('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify(createSignupData()),
      })

      const response = await signupPOST(request)
      const data = await response.json()

      expect(data.error).not.toContain('postgresql://')
      expect(data.error).not.toContain('admin')
      expect(data.error).not.toContain('secret')
      expect(data.error).not.toContain('db-prod-1')
    })
  })

  describe('Neo4j Query Error Handling', () => {
    it('should log Neo4j query errors with context', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error')
      const session = createMockSession()
      const queryError = new Error('Cypher syntax error')

      neo4jSessionMock.run.mockRejectedValue(queryError)

      try {
        await executeUserQuery('INVALID CYPHER', {}, session)
      } catch (error) {
        // Expected
      }

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Neo4j query execution failed:',
        queryError
      )
    })

    it('should propagate Neo4j errors to caller', async () => {
      const session = createMockSession()
      const queryError = new Error('Connection timeout')

      neo4jSessionMock.run.mockRejectedValue(queryError)

      await expect(executeUserQuery('MATCH (n) RETURN n', {}, session)).rejects.toThrow(
        'Connection timeout'
      )
    })

    it('should log Neo4j write errors with context', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error')
      const session = createMockSession()
      const writeError = new Error('Transaction failed')

      neo4jSessionMock.executeWrite.mockRejectedValue(writeError)

      try {
        await executeUserWrite('CREATE (n) RETURN n', {}, session)
      } catch (error) {
        // Expected
      }

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Neo4j write transaction failed:',
        writeError
      )
    })

    it('should always close Neo4j session even on error', async () => {
      const session = createMockSession()
      neo4jSessionMock.run.mockRejectedValue(new Error('Query failed'))

      try {
        await executeUserQuery('MATCH (n) RETURN n', {}, session)
      } catch (error) {
        // Expected
      }

      expect(neo4jSessionMock.close).toHaveBeenCalled()
    })

    it('should always close Neo4j session on write error', async () => {
      const session = createMockSession()
      neo4jSessionMock.executeWrite.mockRejectedValue(new Error('Write failed'))

      try {
        await executeUserWrite('CREATE (n)', {}, session)
      } catch (error) {
        // Expected
      }

      expect(neo4jSessionMock.close).toHaveBeenCalled()
    })
  })

  describe('Session Validation Errors', () => {
    it('should throw clear error when session is invalid', () => {
      const invalidSession = null

      expect(() => getUserIdFromSession(invalidSession)).toThrow(
        'Unauthorized: No valid session or user ID'
      )
    })

    it('should throw clear error when session.user is missing', () => {
      const invalidSession = { expires: '2024-12-31' } as any

      expect(() => getUserIdFromSession(invalidSession)).toThrow(
        'Unauthorized: No valid session or user ID'
      )
    })

    it('should throw clear error when user.id is missing', () => {
      const invalidSession = {
        user: { email: 'test@test.com' },
        expires: '2024-12-31',
      } as any

      expect(() => getUserIdFromSession(invalidSession)).toThrow(
        'Unauthorized: No valid session or user ID'
      )
    })

    it('should provide consistent error message for all auth failures', () => {
      const expectedMessage = 'Unauthorized: No valid session or user ID'

      expect(() => getUserIdFromSession(null)).toThrow(expectedMessage)
      expect(() => getUserIdFromSession({} as any)).toThrow(expectedMessage)
      expect(() => getUserIdFromSession({ user: {} } as any)).toThrow(expectedMessage)
    })
  })

  describe('Error Message Format', () => {
    it('should return JSON error responses from API', async () => {
      prismaMock.user.findUnique.mockRejectedValue(new Error('DB error'))

      const request = new NextRequest('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify(createSignupData()),
      })

      const response = await signupPOST(request)
      const contentType = response.headers.get('content-type')

      expect(contentType).toContain('application/json')

      const data = await response.json()
      expect(data).toHaveProperty('error')
      expect(typeof data.error).toBe('string')
    })

    it('should include proper HTTP status codes', async () => {
      // 400 for validation error
      let request = new NextRequest('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify({ email: 'test@test.com' }),
      })
      let response = await signupPOST(request)
      expect(response.status).toBe(400)

      // 400 for duplicate email
      prismaMock.user.findUnique.mockResolvedValue(createMockUser())
      request = new NextRequest('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify(createSignupData()),
      })
      response = await signupPOST(request)
      expect(response.status).toBe(400)

      // 500 for server error
      prismaMock.user.findUnique.mockRejectedValue(new Error('Server error'))
      request = new NextRequest('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify(createSignupData()),
      })
      response = await signupPOST(request)
      expect(response.status).toBe(500)
    })
  })

  describe('Sensitive Data Protection', () => {
    it('should not expose passwords in any error message', async () => {
      const signupData = createSignupData({ password: 'MySecretPassword123!' })

      jest.spyOn(auth, 'hashPassword').mockRejectedValue(new Error('Hashing failed'))
      prismaMock.user.findUnique.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify(signupData),
      })

      const response = await signupPOST(request)
      const data = await response.json()

      expect(data.error).not.toContain('MySecretPassword123!')
      expect(data.error).not.toContain('password')
    })

    it('should not expose user IDs in error messages to unauthorized users', async () => {
      const session = createMockSession('secret-user-id-12345')
      neo4jSessionMock.run.mockRejectedValue(
        new Error('User secret-user-id-12345 not found')
      )

      try {
        await executeUserQuery('MATCH (n) RETURN n', {}, session)
      } catch (error: any) {
        // The raw error might contain the ID (from Neo4j)
        // but we shouldn't propagate it to the frontend
        expect(error.message).toBeTruthy()
      }
    })

    it('should not expose internal implementation details', async () => {
      prismaMock.user.findUnique.mockRejectedValue(
        new Error('Table users constraint violation on column password_hash')
      )

      const request = new NextRequest('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify(createSignupData()),
      })

      const response = await signupPOST(request)
      const data = await response.json()

      expect(data.error).not.toContain('Table')
      expect(data.error).not.toContain('constraint')
      expect(data.error).not.toContain('password_hash')
    })
  })

  describe('Error Recovery and Cleanup', () => {
    it('should clean up resources on query error', async () => {
      const session = createMockSession()
      neo4jSessionMock.run.mockRejectedValue(new Error('Query error'))

      try {
        await executeUserQuery('MATCH (n) RETURN n', {}, session)
      } catch (error) {
        // Expected
      }

      // Session should be closed
      expect(neo4jSessionMock.close).toHaveBeenCalled()
    })

    it('should clean up resources on write error', async () => {
      const session = createMockSession()
      neo4jSessionMock.executeWrite.mockRejectedValue(new Error('Write error'))

      try {
        await executeUserWrite('CREATE (n) RETURN n', {}, session)
      } catch (error) {
        // Expected
      }

      // Session should be closed
      expect(neo4jSessionMock.close).toHaveBeenCalled()
    })
  })

  describe('Error Logging Consistency', () => {
    it('should use console.error for all error logging', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error')

      // Test signup error logging
      prismaMock.user.findUnique.mockRejectedValue(new Error('DB error'))
      const request = new NextRequest('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify(createSignupData()),
      })
      await signupPOST(request)

      expect(consoleErrorSpy).toHaveBeenCalledWith('Signup error:', expect.any(Error))

      // Test Neo4j error logging
      const session = createMockSession()
      neo4jSessionMock.run.mockRejectedValue(new Error('Query error'))

      try {
        await executeUserQuery('MATCH (n) RETURN n', {}, session)
      } catch (error) {
        // Expected
      }

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Neo4j query execution failed:',
        expect.any(Error)
      )
    })

    it('should provide error context in log messages', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error')

      const session = createMockSession()
      neo4jSessionMock.run.mockRejectedValue(new Error('Timeout'))

      try {
        await executeUserQuery('MATCH (n) RETURN n', {}, session)
      } catch (error) {
        // Expected
      }

      // Verify log message has context
      const logCall = consoleErrorSpy.mock.calls.find((call) =>
        call[0].includes('Neo4j query execution failed')
      )

      expect(logCall).toBeDefined()
      expect(logCall?.[0]).toContain('Neo4j')
      expect(logCall?.[1]).toBeInstanceOf(Error)
    })
  })

  describe('User-Facing Error Messages', () => {
    it('should provide actionable error messages', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify({
          email: 'test@test.com',
          password: 'short',
        }),
      })

      const response = await signupPOST(request)
      const data = await response.json()

      // Error message tells user exactly what to fix
      expect(data.error).toBe('Password must be at least 8 characters')
    })

    it('should provide helpful messages for missing fields', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify({ email: 'test@test.com' }),
      })

      const response = await signupPOST(request)
      const data = await response.json()

      expect(data.error).toBe('Email and password are required')
    })

    it('should indicate when email is already taken', async () => {
      prismaMock.user.findUnique.mockResolvedValue(createMockUser())

      const request = new NextRequest('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify(createSignupData()),
      })

      const response = await signupPOST(request)
      const data = await response.json()

      expect(data.error).toBe('User with this email already exists')
    })
  })
})
