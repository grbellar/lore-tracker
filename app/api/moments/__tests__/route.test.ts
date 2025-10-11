/**
 * Test Suite: GET /api/moments and POST /api/moments
 *
 * Tests for listing moments and creating new moments
 * All tests should FAIL initially until the feature is implemented
 */

import { NextRequest } from 'next/server'
import { GET, POST } from '../route'
import { executeUserQuery, executeUserWrite } from '@/lib/neo4j-auth'
import { getServerSession } from 'next-auth/next'
import { createMockSession } from '@/__tests__/utils/session-mock'

// Mock dependencies
jest.mock('next-auth/next')
jest.mock('@/lib/neo4j-auth')

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;
const mockExecuteUserQuery = executeUserQuery as jest.MockedFunction<typeof executeUserQuery>;
const mockExecuteUserWrite = executeUserWrite as jest.MockedFunction<typeof executeUserWrite>;

describe('GET /api/moments - List Moments', () => {
  const mockSession = createMockSession('user-123', 'test@example.com')

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Authentication', () => {
    it('should return 401 if user is not authenticated', async () => {
      mockGetServerSession.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/moments')
      const response = await GET(request)

      expect(response.status).toBe(401)
      const data = await response.json()
      expect(data.error).toBe('Unauthorized')
    })

    it('should allow authenticated users to access', async () => {
      mockGetServerSession.mockResolvedValue(mockSession)
      mockExecuteUserQuery.mockResolvedValue([])

      const request = new NextRequest('http://localhost:3000/api/moments')
      const response = await GET(request)

      expect(response.status).toBe(200)
    })
  })

  describe('Basic Listing', () => {
    it('should return empty array when user has no moments', async () => {
      mockGetServerSession.mockResolvedValue(mockSession)
      mockExecuteUserQuery.mockResolvedValue([])

      const request = new NextRequest('http://localhost:3000/api/moments')
      const response = await GET(request)

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.data).toEqual([])
    })

    it('should return lightweight moment data (excluding content field)', async () => {
      mockGetServerSession.mockResolvedValue(mockSession)
      mockExecuteUserQuery.mockResolvedValue([
        {
          id: 'moment-1',
          title: 'The Battle Begins',
          preview: 'The armies clashed at dawn...',
          summary: 'First major battle',
          timestamp: '2024-01-01T00:00:00Z',
          created_at: '2024-01-01T00:00:00Z',
        },
      ])

      const request = new NextRequest('http://localhost:3000/api/moments')
      const response = await GET(request)

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.data).toHaveLength(1)
      expect(data.data[0]).toHaveProperty('id')
      expect(data.data[0]).toHaveProperty('title')
      expect(data.data[0]).toHaveProperty('preview')
      expect(data.data[0]).not.toHaveProperty('content') // Should NOT include full content
    })

    it('should return multiple moments sorted by created_at DESC', async () => {
      mockGetServerSession.mockResolvedValue(mockSession)
      mockExecuteUserQuery.mockResolvedValue([
        {
          id: 'moment-2',
          title: 'Second Moment',
          preview: 'Preview 2',
          summary: null,
          timestamp: null,
          created_at: '2024-01-02T00:00:00Z',
        },
        {
          id: 'moment-1',
          title: 'First Moment',
          preview: 'Preview 1',
          summary: null,
          timestamp: null,
          created_at: '2024-01-01T00:00:00Z',
        },
      ])

      const request = new NextRequest('http://localhost:3000/api/moments')
      const response = await GET(request)

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.data).toHaveLength(2)
      // Most recent first
      expect(data.data[0].created_at).toBe('2024-01-02T00:00:00Z')
      expect(data.data[1].created_at).toBe('2024-01-01T00:00:00Z')
    })
  })

  describe('Pagination', () => {
    it('should use default limit of 20 if not specified', async () => {
      mockGetServerSession.mockResolvedValue(mockSession)
      mockExecuteUserQuery.mockResolvedValue([])

      const request = new NextRequest('http://localhost:3000/api/moments')
      await GET(request)

      expect(mockExecuteUserQuery).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ limit: 20 }),
        mockSession
      )
    })

    it('should accept custom limit parameter', async () => {
      mockGetServerSession.mockResolvedValue(mockSession)
      mockExecuteUserQuery.mockResolvedValue([])

      const request = new NextRequest('http://localhost:3000/api/moments?limit=5')
      await GET(request)

      expect(mockExecuteUserQuery).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ limit: 5 }),
        mockSession
      )
    })

    it('should use default skip of 0 if not specified', async () => {
      mockGetServerSession.mockResolvedValue(mockSession)
      mockExecuteUserQuery.mockResolvedValue([])

      const request = new NextRequest('http://localhost:3000/api/moments')
      await GET(request)

      expect(mockExecuteUserQuery).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ skip: 0 }),
        mockSession
      )
    })

    it('should accept custom skip parameter for pagination', async () => {
      mockGetServerSession.mockResolvedValue(mockSession)
      mockExecuteUserQuery.mockResolvedValue([])

      const request = new NextRequest('http://localhost:3000/api/moments?skip=20')
      await GET(request)

      expect(mockExecuteUserQuery).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ skip: 20 }),
        mockSession
      )
    })

    it('should support both limit and skip parameters', async () => {
      mockGetServerSession.mockResolvedValue(mockSession)
      mockExecuteUserQuery.mockResolvedValue([])

      const request = new NextRequest('http://localhost:3000/api/moments?limit=10&skip=30')
      await GET(request)

      expect(mockExecuteUserQuery).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ limit: 10, skip: 30 }),
        mockSession
      )
    })
  })

  describe('User Isolation', () => {
    it('should only query moments belonging to authenticated user', async () => {
      mockGetServerSession.mockResolvedValue(mockSession)
      mockExecuteUserQuery.mockResolvedValue([])

      const request = new NextRequest('http://localhost:3000/api/moments')
      await GET(request)

      // executeUserQuery should be called (it handles user isolation automatically)
      expect(mockExecuteUserQuery).toHaveBeenCalled()

      // Query should include user_id filter
      const queryArg = mockExecuteUserQuery.mock.calls[0][0]
      expect(queryArg).toContain('user_id: $userId')
    })
  })

  describe('Error Handling', () => {
    it('should return 500 if database query fails', async () => {
      mockGetServerSession.mockResolvedValue(mockSession)
      mockExecuteUserQuery.mockRejectedValue(new Error('Database connection failed'))

      const request = new NextRequest('http://localhost:3000/api/moments')
      const response = await GET(request)

      expect(response.status).toBe(500)
      const data = await response.json()
      expect(data.error).toBeDefined()
    })
  })
})

describe('POST /api/moments - Create Moment', () => {
  const mockSession = createMockSession('user-123', 'test@example.com')

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Authentication', () => {
    it('should return 401 if user is not authenticated', async () => {
      mockGetServerSession.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/moments', {
        method: 'POST',
        body: JSON.stringify({ title: 'Test Moment' }),
      })
      const response = await POST(request)

      expect(response.status).toBe(401)
      const data = await response.json()
      expect(data.error).toBe('Unauthorized')
    })
  })

  describe('Input Validation', () => {
    it('should return 400 if title is missing', async () => {
      mockGetServerSession.mockResolvedValue(mockSession)

      const request = new NextRequest('http://localhost:3000/api/moments', {
        method: 'POST',
        body: JSON.stringify({ content: 'Some content' }),
      })
      const response = await POST(request)

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toContain('title')
    })

    it('should return 400 if title is empty string', async () => {
      mockGetServerSession.mockResolvedValue(mockSession)

      const request = new NextRequest('http://localhost:3000/api/moments', {
        method: 'POST',
        body: JSON.stringify({ title: '' }),
      })
      const response = await POST(request)

      expect(response.status).toBe(400)
    })

    it('should accept minimal valid input (title only)', async () => {
      mockGetServerSession.mockResolvedValue(mockSession)
      mockExecuteUserWrite.mockResolvedValue([
        {
          id: 'moment-1',
          user_id: 'user-123',
          title: 'Test Moment',
          content: '',
          summary: null,
          preview: '',
          timestamp: null,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ])

      const request = new NextRequest('http://localhost:3000/api/moments', {
        method: 'POST',
        body: JSON.stringify({ title: 'Test Moment' }),
      })
      const response = await POST(request)

      expect(response.status).toBe(201)
    })
  })

  describe('Moment Creation', () => {
    it('should create moment with all fields provided', async () => {
      mockGetServerSession.mockResolvedValue(mockSession)
      const newMoment = {
        id: 'moment-1',
        user_id: 'user-123',
        title: 'The Battle Begins',
        content: 'The armies clashed at dawn, the sound of steel on steel echoing through the valley.',
        summary: 'First major battle',
        preview: 'The armies clashed at dawn, the sound of steel on steel echoing through the valley.',
        timestamp: '2024-01-01T00:00:00Z',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      }
      mockExecuteUserWrite.mockResolvedValue([newMoment])

      const request = new NextRequest('http://localhost:3000/api/moments', {
        method: 'POST',
        body: JSON.stringify({
          title: 'The Battle Begins',
          content: 'The armies clashed at dawn, the sound of steel on steel echoing through the valley.',
          summary: 'First major battle',
          timestamp: '2024-01-01T00:00:00Z',
        }),
      })
      const response = await POST(request)

      expect(response.status).toBe(201)
      const data = await response.json()
      expect(data.data.id).toBeDefined()
      expect(data.data.title).toBe('The Battle Begins')
      expect(data.data.content).toBe('The armies clashed at dawn, the sound of steel on steel echoing through the valley.')
      expect(data.data.user_id).toBe('user-123')
    })

    it('should auto-generate preview from content if not provided', async () => {
      mockGetServerSession.mockResolvedValue(mockSession)
      const longContent = 'A'.repeat(500) // Content longer than 300 chars
      const expectedPreview = 'A'.repeat(300)

      mockExecuteUserWrite.mockResolvedValue([
        {
          id: 'moment-1',
          user_id: 'user-123',
          title: 'Test',
          content: longContent,
          summary: null,
          preview: expectedPreview,
          timestamp: null,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ])

      const request = new NextRequest('http://localhost:3000/api/moments', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Test',
          content: longContent,
        }),
      })
      const response = await POST(request)

      expect(response.status).toBe(201)
      const data = await response.json()
      expect(data.data.preview).toBe(expectedPreview)
    })

    it('should use provided preview instead of auto-generating', async () => {
      mockGetServerSession.mockResolvedValue(mockSession)
      mockExecuteUserWrite.mockResolvedValue([
        {
          id: 'moment-1',
          user_id: 'user-123',
          title: 'Test',
          content: 'Full content here',
          summary: null,
          preview: 'Custom preview',
          timestamp: null,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ])

      const request = new NextRequest('http://localhost:3000/api/moments', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Test',
          content: 'Full content here',
          preview: 'Custom preview',
        }),
      })
      const response = await POST(request)

      expect(response.status).toBe(201)
      const data = await response.json()
      expect(data.data.preview).toBe('Custom preview')
    })

    it('should generate unique ID for each moment', async () => {
      mockGetServerSession.mockResolvedValue(mockSession)

      const ids: string[] = []
      mockExecuteUserWrite.mockImplementation(async (query, params) => {
        ids.push(params.id)
        return [{
          id: params.id,
          user_id: 'user-123',
          title: params.title,
          content: '',
          summary: null,
          preview: '',
          timestamp: null,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        }]
      })

      // Create two moments
      const request1 = new NextRequest('http://localhost:3000/api/moments', {
        method: 'POST',
        body: JSON.stringify({ title: 'Moment 1' }),
      })
      await POST(request1)

      const request2 = new NextRequest('http://localhost:3000/api/moments', {
        method: 'POST',
        body: JSON.stringify({ title: 'Moment 2' }),
      })
      await POST(request2)

      // IDs should be different
      expect(ids).toHaveLength(2)
      expect(ids[0]).not.toBe(ids[1])
    })

    it('should set created_at and updated_at timestamps', async () => {
      mockGetServerSession.mockResolvedValue(mockSession)
      mockExecuteUserWrite.mockResolvedValue([
        {
          id: 'moment-1',
          user_id: 'user-123',
          title: 'Test',
          content: '',
          summary: null,
          preview: '',
          timestamp: null,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ])

      const request = new NextRequest('http://localhost:3000/api/moments', {
        method: 'POST',
        body: JSON.stringify({ title: 'Test' }),
      })
      const response = await POST(request)

      const data = await response.json()
      expect(data.data.created_at).toBeDefined()
      expect(data.data.updated_at).toBeDefined()
    })
  })

  describe('User Isolation', () => {
    it('should associate moment with authenticated user', async () => {
      mockGetServerSession.mockResolvedValue(mockSession)
      mockExecuteUserWrite.mockResolvedValue([
        {
          id: 'moment-1',
          user_id: 'user-123',
          title: 'Test',
          content: '',
          summary: null,
          preview: '',
          timestamp: null,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ])

      const request = new NextRequest('http://localhost:3000/api/moments', {
        method: 'POST',
        body: JSON.stringify({ title: 'Test' }),
      })
      await POST(request)

      // executeUserWrite should inject userId automatically
      expect(mockExecuteUserWrite).toHaveBeenCalled()
      const queryArg = mockExecuteUserWrite.mock.calls[0][0]
      expect(queryArg).toContain('user_id: $userId')
    })
  })

  describe('Error Handling', () => {
    it('should return 500 if database write fails', async () => {
      mockGetServerSession.mockResolvedValue(mockSession)
      mockExecuteUserWrite.mockRejectedValue(new Error('Database write failed'))

      const request = new NextRequest('http://localhost:3000/api/moments', {
        method: 'POST',
        body: JSON.stringify({ title: 'Test' }),
      })
      const response = await POST(request)

      expect(response.status).toBe(500)
      const data = await response.json()
      expect(data.error).toBeDefined()
    })

    it('should return 400 for invalid JSON body', async () => {
      mockGetServerSession.mockResolvedValue(mockSession)

      const request = new NextRequest('http://localhost:3000/api/moments', {
        method: 'POST',
        body: 'invalid json',
      })
      const response = await POST(request)

      expect(response.status).toBe(400)
    })
  })
})
