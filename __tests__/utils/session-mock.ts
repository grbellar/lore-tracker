import { Session } from 'next-auth'
import { JWT } from 'next-auth/jwt'

/**
 * Create a mock NextAuth session for testing
 */
export function createMockSession(userId: string = 'test-user-id', email: string = 'test@example.com'): Session {
  return {
    user: {
      id: userId,
      email,
      name: 'Test User',
      image: null,
    },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
  }
}

/**
 * Create a mock JWT token for testing
 */
export function createMockJWT(userId: string = 'test-user-id', email: string = 'test@example.com'): JWT {
  return {
    id: userId,
    email,
    name: 'Test User',
    sub: userId,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60, // 24 hours
    jti: 'test-jti',
  }
}

/**
 * Create a mock session for a different user (for isolation tests)
 */
export function createMockSessionForUser(userId: string, email?: string): Session {
  return createMockSession(userId, email || `user-${userId}@example.com`)
}

/**
 * Mock getServerSession to return a specific session
 */
export function mockGetServerSession(session: Session | null = null) {
  const getServerSession = jest.fn(async () => session)

  jest.mock('next-auth/next', () => ({
    __esModule: true,
    getServerSession,
  }))

  return getServerSession
}

export default {
  createMockSession,
  createMockJWT,
  createMockSessionForUser,
  mockGetServerSession,
}
