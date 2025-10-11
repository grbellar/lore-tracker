import { POST } from '../route'
import { NextRequest } from 'next/server'
import { prismaMock } from '../../../../../__tests__/utils/prisma-mock'
import { createSignupData, createMockUser } from '../../../../../__tests__/utils/factories'
import * as auth from '../../../../../lib/auth'

// Mock the auth module
jest.mock('../../../../../lib/auth')

describe('POST /api/auth/signup', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Successful signup', () => {
    it('should create a new user with valid data', async () => {
      const signupData = createSignupData({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
      })

      const mockUser = createMockUser({
        id: 'new-user-id',
        name: signupData.name,
        email: signupData.email,
      })

      // Mock database: no existing user
      prismaMock.user.findUnique.mockResolvedValue(null)

      // Mock password hashing
      jest.spyOn(auth, 'hashPassword').mockResolvedValue('hashed-password-123')

      // Mock user creation
      prismaMock.user.create.mockResolvedValue(mockUser)

      const request = new NextRequest('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify(signupData),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.user).toEqual({
        id: 'new-user-id',
        name: 'John Doe',
        email: 'john@example.com',
      })
      expect(prismaMock.user.create).toHaveBeenCalledWith({
        data: {
          name: 'John Doe',
          email: 'john@example.com',
          password: 'hashed-password-123',
        },
      })
    })

    it('should hash the password before storing', async () => {
      const signupData = createSignupData({ password: 'mySecurePassword' })
      prismaMock.user.findUnique.mockResolvedValue(null)
      jest.spyOn(auth, 'hashPassword').mockResolvedValue('$2a$10$hashed...')
      prismaMock.user.create.mockResolvedValue(createMockUser())

      const request = new NextRequest('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify(signupData),
      })

      await POST(request)

      expect(auth.hashPassword).toHaveBeenCalledWith('mySecurePassword')
      expect(prismaMock.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            password: '$2a$10$hashed...',
          }),
        })
      )
    })

    it('should not include password in response', async () => {
      const signupData = createSignupData()
      prismaMock.user.findUnique.mockResolvedValue(null)
      jest.spyOn(auth, 'hashPassword').mockResolvedValue('hashed')
      prismaMock.user.create.mockResolvedValue(createMockUser())

      const request = new NextRequest('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify(signupData),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(data.user).toBeDefined()
      expect(data.user.password).toBeUndefined()
      expect(data.user.id).toBeDefined()
      expect(data.user.email).toBeDefined()
    })
  })

  describe('Validation errors', () => {
    it('should return 400 when email is missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify({ name: 'Test', password: 'password123' }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Email and password are required')
    })

    it('should return 400 when password is missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify({ name: 'Test', email: 'test@example.com' }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Email and password are required')
    })

    it('should return 400 when both email and password are missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify({ name: 'Test' }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Email and password are required')
    })

    it('should return 400 when password is less than 8 characters', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test',
          email: 'test@example.com',
          password: 'short',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Password must be at least 8 characters')
    })

    it('should accept password exactly 8 characters', async () => {
      const signupData = createSignupData({ password: '12345678' })
      prismaMock.user.findUnique.mockResolvedValue(null)
      jest.spyOn(auth, 'hashPassword').mockResolvedValue('hashed')
      prismaMock.user.create.mockResolvedValue(createMockUser())

      const request = new NextRequest('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify(signupData),
      })

      const response = await POST(request)

      expect(response.status).toBe(201)
    })

    it('should handle empty string password', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test',
          email: 'test@example.com',
          password: '',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Email and password are required')
    })

    it('should handle empty string email', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test',
          email: '',
          password: 'password123',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Email and password are required')
    })
  })

  describe('Duplicate email handling', () => {
    it('should return 400 when email already exists', async () => {
      const signupData = createSignupData({ email: 'existing@example.com' })
      const existingUser = createMockUser({ email: 'existing@example.com' })

      // Mock: user already exists
      prismaMock.user.findUnique.mockResolvedValue(existingUser)

      const request = new NextRequest('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify(signupData),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('User with this email already exists')
      expect(prismaMock.user.create).not.toHaveBeenCalled()
    })

    it('should check for existing user before creating', async () => {
      const signupData = createSignupData({ email: 'test@example.com' })
      prismaMock.user.findUnique.mockResolvedValue(null)
      jest.spyOn(auth, 'hashPassword').mockResolvedValue('hashed')
      prismaMock.user.create.mockResolvedValue(createMockUser())

      const request = new NextRequest('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify(signupData),
      })

      await POST(request)

      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      })
      expect(prismaMock.user.findUnique).toHaveBeenCalledBefore(prismaMock.user.create)
    })

    it('should be case-sensitive for email comparison', async () => {
      const signupData = createSignupData({ email: 'Test@Example.Com' })
      prismaMock.user.findUnique.mockResolvedValue(null)
      jest.spyOn(auth, 'hashPassword').mockResolvedValue('hashed')
      prismaMock.user.create.mockResolvedValue(createMockUser())

      const request = new NextRequest('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify(signupData),
      })

      await POST(request)

      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'Test@Example.Com' },
      })
    })
  })

  describe('Database error handling', () => {
    it('should return 500 when database query fails', async () => {
      const signupData = createSignupData()
      prismaMock.user.findUnique.mockRejectedValue(new Error('Database connection failed'))

      const request = new NextRequest('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify(signupData),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('An error occurred during signup')
    })

    it('should return 500 when user creation fails', async () => {
      const signupData = createSignupData()
      prismaMock.user.findUnique.mockResolvedValue(null)
      jest.spyOn(auth, 'hashPassword').mockResolvedValue('hashed')
      prismaMock.user.create.mockRejectedValue(new Error('Insert failed'))

      const request = new NextRequest('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify(signupData),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('An error occurred during signup')
    })

    it('should return 500 when password hashing fails', async () => {
      const signupData = createSignupData()
      prismaMock.user.findUnique.mockResolvedValue(null)
      jest.spyOn(auth, 'hashPassword').mockRejectedValue(new Error('Hashing failed'))

      const request = new NextRequest('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify(signupData),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('An error occurred during signup')
    })
  })

  describe('Error logging and propagation', () => {
    it('should log errors to console.error', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error')
      const signupData = createSignupData()
      const dbError = new Error('Database error')
      prismaMock.user.findUnique.mockRejectedValue(dbError)

      const request = new NextRequest('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify(signupData),
      })

      await POST(request)

      expect(consoleErrorSpy).toHaveBeenCalledWith('Signup error:', dbError)
    })

    it('should not expose internal error details to user', async () => {
      const signupData = createSignupData()
      prismaMock.user.findUnique.mockRejectedValue(
        new Error('Internal: Connection to db-server-123 failed')
      )

      const request = new NextRequest('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify(signupData),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(data.error).toBe('An error occurred during signup')
      expect(data.error).not.toContain('db-server-123')
    })

    it('should propagate user-friendly error messages', async () => {
      const signupData = createSignupData({ password: 'short' })

      const request = new NextRequest('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify(signupData),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(data.error).toBe('Password must be at least 8 characters')
      expect(data.error).toBeTruthy()
    })
  })

  describe('Edge cases', () => {
    it('should handle malformed JSON', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        body: 'not valid json',
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('An error occurred during signup')
    })

    it('should handle null values in request', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify({
          name: null,
          email: null,
          password: null,
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Email and password are required')
    })

    it('should handle undefined values in request', async () => {
      const request = new NextRequest('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify({}),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Email and password are required')
    })

    it('should handle very long passwords', async () => {
      const longPassword = 'a'.repeat(1000)
      const signupData = createSignupData({ password: longPassword })

      prismaMock.user.findUnique.mockResolvedValue(null)
      jest.spyOn(auth, 'hashPassword').mockResolvedValue('hashed')
      prismaMock.user.create.mockResolvedValue(createMockUser())

      const request = new NextRequest('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify(signupData),
      })

      const response = await POST(request)

      expect(response.status).toBe(201)
    })

    it('should handle special characters in email', async () => {
      const signupData = createSignupData({ email: 'user+test@example.co.uk' })

      prismaMock.user.findUnique.mockResolvedValue(null)
      jest.spyOn(auth, 'hashPassword').mockResolvedValue('hashed')
      prismaMock.user.create.mockResolvedValue(createMockUser())

      const request = new NextRequest('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify(signupData),
      })

      const response = await POST(request)

      expect(response.status).toBe(201)
    })

    it('should handle special characters in name', async () => {
      const signupData = createSignupData({ name: "O'Brien-Smith Jr." })

      prismaMock.user.findUnique.mockResolvedValue(null)
      jest.spyOn(auth, 'hashPassword').mockResolvedValue('hashed')
      prismaMock.user.create.mockResolvedValue(createMockUser())

      const request = new NextRequest('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify(signupData),
      })

      const response = await POST(request)

      expect(response.status).toBe(201)
    })
  })
})
