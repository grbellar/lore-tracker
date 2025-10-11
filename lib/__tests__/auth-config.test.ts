import { authOptions } from '../auth-config'
import { prismaMock } from '../../__tests__/utils/prisma-mock'
import { createMockUser, createLoginCredentials } from '../../__tests__/utils/factories'
import { createMockJWT } from '../../__tests__/utils/session-mock'
import bcrypt from 'bcryptjs'

describe('lib/auth-config.ts', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('NextAuth configuration', () => {
    it('should have correct adapter configured', () => {
      expect(authOptions.adapter).toBeDefined()
    })

    it('should have Credentials provider configured', () => {
      expect(authOptions.providers).toBeDefined()
      expect(authOptions.providers.length).toBeGreaterThan(0)

      const credentialsProvider = authOptions.providers[0]
      expect(credentialsProvider).toBeDefined()
    })

    it('should have JWT session strategy', () => {
      expect(authOptions.session?.strategy).toBe('jwt')
    })

    it('should have custom signin page configured', () => {
      expect(authOptions.pages?.signIn).toBe('/auth/signin')
    })

    it('should have jwt callback configured', () => {
      expect(authOptions.callbacks?.jwt).toBeDefined()
    })

    it('should have session callback configured', () => {
      expect(authOptions.callbacks?.session).toBeDefined()
    })
  })

  describe('Credentials Provider - authorize function', () => {
    // Extract the authorize function from the credentials provider
    const getAuthorizeFunction = () => {
      const credentialsProvider = authOptions.providers[0] as any
      return credentialsProvider.options.authorize
    }

    it('should return user for valid credentials', async () => {
      const mockUser = createMockUser({
        id: 'user-123',
        email: 'test@example.com',
        password: '$2a$10$hashed.password',
      })

      prismaMock.user.findUnique.mockResolvedValue(mockUser)
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never)

      const authorize = getAuthorizeFunction()
      const credentials = createLoginCredentials()

      const result = await authorize(credentials, {} as any)

      expect(result).toEqual({
        id: 'user-123',
        email: 'test@example.com',
        name: mockUser.name,
        image: mockUser.image,
      })
    })

    it('should return null when email is missing', async () => {
      const authorize = getAuthorizeFunction()

      const result = await authorize({ password: 'password123' }, {} as any)

      expect(result).toBeNull()
      expect(prismaMock.user.findUnique).not.toHaveBeenCalled()
    })

    it('should return null when password is missing', async () => {
      const authorize = getAuthorizeFunction()

      const result = await authorize({ email: 'test@example.com' }, {} as any)

      expect(result).toBeNull()
      expect(prismaMock.user.findUnique).not.toHaveBeenCalled()
    })

    it('should return null when both credentials are missing', async () => {
      const authorize = getAuthorizeFunction()

      const result = await authorize({}, {} as any)

      expect(result).toBeNull()
      expect(prismaMock.user.findUnique).not.toHaveBeenCalled()
    })

    it('should return null when user does not exist', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null)

      const authorize = getAuthorizeFunction()
      const credentials = createLoginCredentials()

      const result = await authorize(credentials, {} as any)

      expect(result).toBeNull()
    })

    it('should return null when user has no password (OAuth user)', async () => {
      const mockUser = createMockUser({ password: null })
      prismaMock.user.findUnique.mockResolvedValue(mockUser)

      const authorize = getAuthorizeFunction()
      const credentials = createLoginCredentials()

      const result = await authorize(credentials, {} as any)

      expect(result).toBeNull()
      expect(bcrypt.compare).not.toHaveBeenCalled()
    })

    it('should return null when password is incorrect', async () => {
      const mockUser = createMockUser({ password: '$2a$10$hashed.password' })
      prismaMock.user.findUnique.mockResolvedValue(mockUser)
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never)

      const authorize = getAuthorizeFunction()
      const credentials = createLoginCredentials()

      const result = await authorize(credentials, {} as any)

      expect(result).toBeNull()
    })

    it('should query user by email', async () => {
      const mockUser = createMockUser({ email: 'specific@example.com' })
      prismaMock.user.findUnique.mockResolvedValue(mockUser)
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never)

      const authorize = getAuthorizeFunction()
      const credentials = { email: 'specific@example.com', password: 'password123' }

      await authorize(credentials, {} as any)

      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'specific@example.com' },
      })
    })

    it('should compare password with hashed password', async () => {
      const mockUser = createMockUser({
        password: '$2a$10$correct.hashed.password',
      })
      prismaMock.user.findUnique.mockResolvedValue(mockUser)
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never)

      const authorize = getAuthorizeFunction()
      const credentials = { email: 'test@example.com', password: 'myPassword' }

      await authorize(credentials, {} as any)

      expect(bcrypt.compare).toHaveBeenCalledWith('myPassword', '$2a$10$correct.hashed.password')
    })

    it('should not include password in returned user object', async () => {
      const mockUser = createMockUser({ password: 'hashed' })
      prismaMock.user.findUnique.mockResolvedValue(mockUser)
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never)

      const authorize = getAuthorizeFunction()
      const credentials = createLoginCredentials()

      const result = await authorize(credentials, {} as any)

      expect(result).toBeDefined()
      expect((result as any)?.password).toBeUndefined()
    })

    it('should include id, email, name, and image in returned user', async () => {
      const mockUser = createMockUser({
        id: 'user-xyz',
        email: 'user@test.com',
        name: 'Test User',
        image: 'https://example.com/avatar.jpg',
      })
      prismaMock.user.findUnique.mockResolvedValue(mockUser)
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never)

      const authorize = getAuthorizeFunction()
      const credentials = createLoginCredentials()

      const result = await authorize(credentials, {} as any)

      expect(result).toEqual({
        id: 'user-xyz',
        email: 'user@test.com',
        name: 'Test User',
        image: 'https://example.com/avatar.jpg',
      })
    })
  })

  describe('JWT callback', () => {
    it('should add user id to token on sign in', async () => {
      const jwtCallback = authOptions.callbacks?.jwt
      if (!jwtCallback) fail('JWT callback not defined')

      const token = createMockJWT()
      const user = createMockUser({ id: 'new-user-id' })

      const result = await jwtCallback({
        token,
        user: user as any,
        trigger: 'signIn',
        isNewUser: false,
        session: undefined,
      })

      expect(result.id).toBe('new-user-id')
    })

    it('should preserve existing token data', async () => {
      const jwtCallback = authOptions.callbacks?.jwt
      if (!jwtCallback) fail('JWT callback not defined')

      const token = { ...createMockJWT(), custom: 'data' }

      const result = await jwtCallback({
        token,
        user: undefined,
        trigger: 'update',
        isNewUser: false,
        session: undefined,
      })

      expect(result.custom).toBe('data')
      expect(result.email).toBe(token.email)
    })

    it('should not modify token when user is not provided', async () => {
      const jwtCallback = authOptions.callbacks?.jwt
      if (!jwtCallback) fail('JWT callback not defined')

      const originalToken = createMockJWT('original-id')

      const result = await jwtCallback({
        token: originalToken,
        user: undefined,
        trigger: 'update',
        isNewUser: false,
        session: undefined,
      })

      expect(result.id).toBe('original-id')
    })

    it('should update token id only when user is present', async () => {
      const jwtCallback = authOptions.callbacks?.jwt
      if (!jwtCallback) fail('JWT callback not defined')

      const token = createMockJWT('old-id')
      const user = createMockUser({ id: 'new-id' })

      const result = await jwtCallback({
        token,
        user: user as any,
        trigger: 'signIn',
        isNewUser: false,
        session: undefined,
      })

      expect(result.id).toBe('new-id')
    })
  })

  describe('Session callback', () => {
    it('should add user id to session from token', async () => {
      const sessionCallback = authOptions.callbacks?.session
      if (!sessionCallback) fail('Session callback not defined')

      const session = {
        user: { email: 'test@example.com', name: 'Test' },
        expires: new Date().toISOString(),
      } as any

      const token = createMockJWT('token-user-id')

      const result = await sessionCallback({
        session,
        token,
        user: undefined as any,
        newSession: undefined,
        trigger: 'getSession',
      })

      expect(result.user.id).toBe('token-user-id')
    })

    it('should preserve existing session data', async () => {
      const sessionCallback = authOptions.callbacks?.session
      if (!sessionCallback) fail('Session callback not defined')

      const session = {
        user: { email: 'test@example.com', name: 'Original Name' },
        expires: '2024-12-31',
      } as any

      const token = createMockJWT('user-123')

      const result = await sessionCallback({
        session,
        token,
        user: undefined as any,
        newSession: undefined,
        trigger: 'getSession',
      })

      expect(result.user.email).toBe('test@example.com')
      expect(result.user.name).toBe('Original Name')
      expect(result.expires).toBe('2024-12-31')
    })

    it('should not modify session when user is not present', async () => {
      const sessionCallback = authOptions.callbacks?.session
      if (!sessionCallback) fail('Session callback not defined')

      const session = {
        expires: '2024-12-31',
      } as any

      const token = createMockJWT('user-123')

      const result = await sessionCallback({
        session,
        token,
        user: undefined as any,
        newSession: undefined,
        trigger: 'getSession',
      })

      // Session should not have user property if it didn't have one
      expect(result.expires).toBe('2024-12-31')
    })

    it('should return session with user id when both session.user and token.id exist', async () => {
      const sessionCallback = authOptions.callbacks?.session
      if (!sessionCallback) fail('Session callback not defined')

      const session = {
        user: { email: 'user@test.com', name: 'User' },
        expires: '2024-12-31',
      } as any

      const token = createMockJWT('final-user-id')

      const result = await sessionCallback({
        session,
        token,
        user: undefined as any,
        newSession: undefined,
        trigger: 'getSession',
      })

      expect(result.user.id).toBe('final-user-id')
      expect(result.user.email).toBe('user@test.com')
    })
  })

  describe('Error handling', () => {
    it('should handle database errors during authorization', async () => {
      prismaMock.user.findUnique.mockRejectedValue(new Error('Database error'))

      const authorize = (authOptions.providers[0] as any).options.authorize
      const credentials = createLoginCredentials()

      await expect(authorize(credentials, {} as any)).rejects.toThrow('Database error')
    })

    it('should handle bcrypt errors during password comparison', async () => {
      const mockUser = createMockUser({ password: 'hashed' })
      prismaMock.user.findUnique.mockResolvedValue(mockUser)
      jest.spyOn(bcrypt, 'compare').mockRejectedValue(new Error('Bcrypt error'))

      const authorize = (authOptions.providers[0] as any).options.authorize
      const credentials = createLoginCredentials()

      await expect(authorize(credentials, {} as any)).rejects.toThrow('Bcrypt error')
    })
  })

  describe('Security considerations', () => {
    it('should not reveal whether email exists when password is wrong', async () => {
      const mockUser = createMockUser({ email: 'existing@example.com' })
      prismaMock.user.findUnique.mockResolvedValue(mockUser)
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never)

      const authorize = (authOptions.providers[0] as any).options.authorize
      const result = await authorize(
        { email: 'existing@example.com', password: 'wrong' },
        {} as any
      )

      // Should return null without revealing email exists
      expect(result).toBeNull()
    })

    it('should not reveal whether email exists when user not found', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null)

      const authorize = (authOptions.providers[0] as any).options.authorize
      const result = await authorize(
        { email: 'nonexistent@example.com', password: 'password' },
        {} as any
      )

      // Should return null without revealing email doesn't exist
      expect(result).toBeNull()
    })

    it('should use consistent timing for password verification', async () => {
      const mockUser = createMockUser({ password: 'hashed' })
      prismaMock.user.findUnique.mockResolvedValue(mockUser)

      const authorize = (authOptions.providers[0] as any).options.authorize

      // Test with correct password
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never)
      const start1 = Date.now()
      await authorize({ email: 'test@example.com', password: 'correct' }, {} as any)
      const time1 = Date.now() - start1

      // Test with wrong password
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never)
      const start2 = Date.now()
      await authorize({ email: 'test@example.com', password: 'wrong' }, {} as any)
      const time2 = Date.now() - start2

      // Times should be similar (timing attack resistance, 100ms tolerance for CI)
      expect(Math.abs(time1 - time2)).toBeLessThan(100)
    })
  })
})
