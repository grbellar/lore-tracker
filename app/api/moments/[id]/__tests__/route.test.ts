/**
 * Test Suite: GET /api/moments/[id], PATCH /api/moments/[id], DELETE /api/moments/[id]
 *
 * Tests for retrieving, updating, and deleting individual moments
 * All tests should FAIL initially until the feature is implemented
 */

import { NextRequest } from 'next/server'
import { GET, PATCH, DELETE } from '../route'
import { executeUserQuery, executeUserWrite, verifyNodeOwnership } from '@/lib/neo4j-auth'
import { getServerSession } from 'next-auth/next'
import { createMockSession } from '@/__tests__/utils/session-mock'

// Mock dependencies
jest.mock('next-auth/next')
jest.mock('@/lib/neo4j-auth')

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;
const mockExecuteUserQuery = executeUserQuery as jest.MockedFunction<typeof executeUserQuery>;
const mockExecuteUserWrite = executeUserWrite as jest.MockedFunction<typeof executeUserWrite>;
const mockVerifyNodeOwnership = verifyNodeOwnership as jest.MockedFunction<typeof verifyNodeOwnership>;

describe('GET /api/moments/[id] - Get Single Moment', () => {
  const mockSession = createMockSession('user-123', 'test@example.com')
  const mockMoment = {
    id: 'moment-1',
    user_id: 'user-123',
    title: 'The Battle Begins',
    content: 'The armies clashed at dawn, the sound of steel on steel echoing through the valley.',
    summary: 'First major battle',
    preview: 'The armies clashed at dawn...',
    timestamp: '2024-01-01T00:00:00Z',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Authentication', () => {
    it('should return 401 if user is not authenticated', async () => {
      mockGetServerSession.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/moments/moment-1')
      const response = await GET(request, { params: { id: 'moment-1' } })

      expect(response.status).toBe(401)
      const data = await response.json()
      expect(data.error).toBe('Unauthorized')
    })
  })

  describe('Full Mode (Default)', () => {
    it('should return full moment data including content field', async () => {
      mockGetServerSession.mockResolvedValue(mockSession)
      mockExecuteUserQuery.mockResolvedValue([mockMoment])

      const request = new NextRequest('http://localhost:3000/api/moments/moment-1')
      const response = await GET(request, { params: { id: 'moment-1' } })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.data).toHaveProperty('content')
      expect(data.data.content).toBe(mockMoment.content)
    })

    it('should return all moment fields in full mode', async () => {
      mockGetServerSession.mockResolvedValue(mockSession)
      mockExecuteUserQuery.mockResolvedValue([mockMoment])

      const request = new NextRequest('http://localhost:3000/api/moments/moment-1')
      const response = await GET(request, { params: { id: 'moment-1' } })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.data).toMatchObject({
        id: 'moment-1',
        title: 'The Battle Begins',
        content: expect.any(String),
        summary: 'First major battle',
        preview: expect.any(String),
      })
    })

    it('should accept fields=full parameter explicitly', async () => {
      mockGetServerSession.mockResolvedValue(mockSession)
      mockExecuteUserQuery.mockResolvedValue([mockMoment])

      const request = new NextRequest('http://localhost:3000/api/moments/moment-1?fields=full')
      const response = await GET(request, { params: { id: 'moment-1' } })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.data).toHaveProperty('content')
    })
  })

  describe('Lightweight Mode', () => {
    it('should exclude content field when fields=lightweight', async () => {
      mockGetServerSession.mockResolvedValue(mockSession)
      const lightweightMoment = {
        id: 'moment-1',
        title: 'The Battle Begins',
        summary: 'First major battle',
        preview: 'The armies clashed at dawn...',
        timestamp: '2024-01-01T00:00:00Z',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      }
      mockExecuteUserQuery.mockResolvedValue([lightweightMoment])

      const request = new NextRequest('http://localhost:3000/api/moments/moment-1?fields=lightweight')
      const response = await GET(request, { params: { id: 'moment-1' } })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.data).not.toHaveProperty('content')
      expect(data.data).toHaveProperty('preview')
      expect(data.data).toHaveProperty('title')
    })

    it('should return all fields except content in lightweight mode', async () => {
      mockGetServerSession.mockResolvedValue(mockSession)
      const lightweightMoment = {
        id: 'moment-1',
        title: 'The Battle Begins',
        summary: 'First major battle',
        preview: 'The armies clashed at dawn...',
        timestamp: '2024-01-01T00:00:00Z',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      }
      mockExecuteUserQuery.mockResolvedValue([lightweightMoment])

      const request = new NextRequest('http://localhost:3000/api/moments/moment-1?fields=lightweight')
      const response = await GET(request, { params: { id: 'moment-1' } })

      const data = await response.json()
      expect(data.data).toMatchObject({
        id: 'moment-1',
        title: 'The Battle Begins',
        summary: 'First major battle',
        preview: expect.any(String),
        timestamp: expect.any(String),
        created_at: expect.any(String),
        updated_at: expect.any(String),
      })
    })
  })

  describe('Relationships (Full Mode)', () => {
    it('should include related characters if they exist', async () => {
      mockGetServerSession.mockResolvedValue(mockSession)
      const momentWithRelations = {
        ...mockMoment,
        characters: [
          { id: 'char-1', name: 'Luke Skywalker' },
          { id: 'char-2', name: 'Darth Vader' },
        ],
      }
      mockExecuteUserQuery.mockResolvedValue([momentWithRelations])

      const request = new NextRequest('http://localhost:3000/api/moments/moment-1')
      const response = await GET(request, { params: { id: 'moment-1' } })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.data.characters).toHaveLength(2)
      expect(data.data.characters[0]).toHaveProperty('id')
      expect(data.data.characters[0]).toHaveProperty('name')
    })

    it('should include related locations if they exist', async () => {
      mockGetServerSession.mockResolvedValue(mockSession)
      const momentWithRelations = {
        ...mockMoment,
        locations: [
          { id: 'loc-1', name: 'Death Star' },
        ],
      }
      mockExecuteUserQuery.mockResolvedValue([momentWithRelations])

      const request = new NextRequest('http://localhost:3000/api/moments/moment-1')
      const response = await GET(request, { params: { id: 'moment-1' } })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.data.locations).toHaveLength(1)
      expect(data.data.locations[0].name).toBe('Death Star')
    })

    it('should handle moments with no relationships', async () => {
      mockGetServerSession.mockResolvedValue(mockSession)
      mockExecuteUserQuery.mockResolvedValue([mockMoment])

      const request = new NextRequest('http://localhost:3000/api/moments/moment-1')
      const response = await GET(request, { params: { id: 'moment-1' } })

      expect(response.status).toBe(200)
      // Should not error, relationships are optional
    })
  })

  describe('User Isolation', () => {
    it('should only return moment if it belongs to authenticated user', async () => {
      mockGetServerSession.mockResolvedValue(mockSession)
      mockExecuteUserQuery.mockResolvedValue([mockMoment])

      const request = new NextRequest('http://localhost:3000/api/moments/moment-1')
      await GET(request, { params: { id: 'moment-1' } })

      expect(mockExecuteUserQuery).toHaveBeenCalled()
      const queryArg = mockExecuteUserQuery.mock.calls[0][0]
      expect(queryArg).toContain('user_id: $userId')
    })

    it('should return 404 if moment belongs to different user', async () => {
      mockGetServerSession.mockResolvedValue(mockSession)
      mockExecuteUserQuery.mockResolvedValue([]) // No results found

      const request = new NextRequest('http://localhost:3000/api/moments/other-user-moment')
      const response = await GET(request, { params: { id: 'other-user-moment' } })

      expect(response.status).toBe(404)
      const data = await response.json()
      expect(data.error).toContain('not found')
    })
  })

  describe('Error Handling', () => {
    it('should return 404 if moment does not exist', async () => {
      mockGetServerSession.mockResolvedValue(mockSession)
      mockExecuteUserQuery.mockResolvedValue([])

      const request = new NextRequest('http://localhost:3000/api/moments/nonexistent')
      const response = await GET(request, { params: { id: 'nonexistent' } })

      expect(response.status).toBe(404)
    })

    it('should return 500 if database query fails', async () => {
      mockGetServerSession.mockResolvedValue(mockSession)
      mockExecuteUserQuery.mockRejectedValue(new Error('Database error'))

      const request = new NextRequest('http://localhost:3000/api/moments/moment-1')
      const response = await GET(request, { params: { id: 'moment-1' } })

      expect(response.status).toBe(500)
    })
  })
})

describe('PATCH /api/moments/[id] - Update Moment', () => {
  const mockSession = createMockSession('user-123', 'test@example.com')

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Authentication', () => {
    it('should return 401 if user is not authenticated', async () => {
      mockGetServerSession.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/moments/moment-1', {
        method: 'PATCH',
        body: JSON.stringify({ title: 'Updated Title' }),
      })
      const response = await PATCH(request, { params: { id: 'moment-1' } })

      expect(response.status).toBe(401)
    })
  })

  describe('Ownership Verification', () => {
    it('should verify ownership before allowing update', async () => {
      mockGetServerSession.mockResolvedValue(mockSession)
      mockVerifyNodeOwnership.mockResolvedValue(true)
      mockExecuteUserWrite.mockResolvedValue([
        {
          id: 'moment-1',
          user_id: 'user-123',
          title: 'Updated Title',
          content: '',
          summary: null,
          preview: '',
          timestamp: null,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-02T00:00:00Z',
        },
      ])

      const request = new NextRequest('http://localhost:3000/api/moments/moment-1', {
        method: 'PATCH',
        body: JSON.stringify({ title: 'Updated Title' }),
      })
      await PATCH(request, { params: { id: 'moment-1' } })

      expect(mockVerifyNodeOwnership).toHaveBeenCalledWith('Moment', 'moment-1', mockSession)
    })

    it('should return 404 if moment does not exist', async () => {
      mockGetServerSession.mockResolvedValue(mockSession)
      mockVerifyNodeOwnership.mockResolvedValue(false)

      const request = new NextRequest('http://localhost:3000/api/moments/nonexistent', {
        method: 'PATCH',
        body: JSON.stringify({ title: 'Updated Title' }),
      })
      const response = await PATCH(request, { params: { id: 'nonexistent' } })

      expect(response.status).toBe(404)
    })

    it('should return 404 if moment belongs to different user', async () => {
      mockGetServerSession.mockResolvedValue(mockSession)
      mockVerifyNodeOwnership.mockResolvedValue(false) // Not owner

      const request = new NextRequest('http://localhost:3000/api/moments/other-user-moment', {
        method: 'PATCH',
        body: JSON.stringify({ title: 'Updated Title' }),
      })
      const response = await PATCH(request, { params: { id: 'other-user-moment' } })

      expect(response.status).toBe(404)
      const data = await response.json()
      expect(data.error).toContain('not found')
    })
  })

  describe('Update Operations', () => {
    beforeEach(() => {
      mockGetServerSession.mockResolvedValue(mockSession)
      mockVerifyNodeOwnership.mockResolvedValue(true)
    })

    it('should update title field', async () => {
      mockExecuteUserWrite.mockResolvedValue([
        {
          id: 'moment-1',
          user_id: 'user-123',
          title: 'New Title',
          content: 'Original content',
          summary: null,
          preview: 'Original content',
          timestamp: null,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-02T00:00:00Z',
        },
      ])

      const request = new NextRequest('http://localhost:3000/api/moments/moment-1', {
        method: 'PATCH',
        body: JSON.stringify({ title: 'New Title' }),
      })
      const response = await PATCH(request, { params: { id: 'moment-1' } })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.data.title).toBe('New Title')
    })

    it('should update content field', async () => {
      mockExecuteUserWrite.mockResolvedValue([
        {
          id: 'moment-1',
          user_id: 'user-123',
          title: 'Original Title',
          content: 'New content',
          summary: null,
          preview: 'New content',
          timestamp: null,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-02T00:00:00Z',
        },
      ])

      const request = new NextRequest('http://localhost:3000/api/moments/moment-1', {
        method: 'PATCH',
        body: JSON.stringify({ content: 'New content' }),
      })
      const response = await PATCH(request, { params: { id: 'moment-1' } })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.data.content).toBe('New content')
    })

    it('should update multiple fields at once', async () => {
      mockExecuteUserWrite.mockResolvedValue([
        {
          id: 'moment-1',
          user_id: 'user-123',
          title: 'New Title',
          content: 'New content',
          summary: 'New summary',
          preview: 'New content',
          timestamp: '2024-06-01T00:00:00Z',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-02T00:00:00Z',
        },
      ])

      const request = new NextRequest('http://localhost:3000/api/moments/moment-1', {
        method: 'PATCH',
        body: JSON.stringify({
          title: 'New Title',
          content: 'New content',
          summary: 'New summary',
          timestamp: '2024-06-01T00:00:00Z',
        }),
      })
      const response = await PATCH(request, { params: { id: 'moment-1' } })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.data.title).toBe('New Title')
      expect(data.data.content).toBe('New content')
      expect(data.data.summary).toBe('New summary')
    })

    it('should auto-update preview when content is updated without explicit preview', async () => {
      const longContent = 'A'.repeat(500)
      const expectedPreview = 'A'.repeat(300)

      mockExecuteUserWrite.mockResolvedValue([
        {
          id: 'moment-1',
          user_id: 'user-123',
          title: 'Title',
          content: longContent,
          summary: null,
          preview: expectedPreview,
          timestamp: null,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-02T00:00:00Z',
        },
      ])

      const request = new NextRequest('http://localhost:3000/api/moments/moment-1', {
        method: 'PATCH',
        body: JSON.stringify({ content: longContent }),
      })
      const response = await PATCH(request, { params: { id: 'moment-1' } })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.data.preview).toBe(expectedPreview)
    })

    it('should update updated_at timestamp', async () => {
      mockExecuteUserWrite.mockResolvedValue([
        {
          id: 'moment-1',
          user_id: 'user-123',
          title: 'New Title',
          content: '',
          summary: null,
          preview: '',
          timestamp: null,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-02T00:00:00Z',
        },
      ])

      const request = new NextRequest('http://localhost:3000/api/moments/moment-1', {
        method: 'PATCH',
        body: JSON.stringify({ title: 'New Title' }),
      })
      const response = await PATCH(request, { params: { id: 'moment-1' } })

      const data = await response.json()
      expect(data.data.updated_at).toBeDefined()
      expect(mockExecuteUserWrite).toHaveBeenCalled()
      const query = mockExecuteUserWrite.mock.calls[0][0]
      expect(query).toContain('updated_at')
    })

    it('should not update created_at timestamp', async () => {
      mockExecuteUserWrite.mockResolvedValue([
        {
          id: 'moment-1',
          user_id: 'user-123',
          title: 'New Title',
          content: '',
          summary: null,
          preview: '',
          timestamp: null,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-02T00:00:00Z',
        },
      ])

      const request = new NextRequest('http://localhost:3000/api/moments/moment-1', {
        method: 'PATCH',
        body: JSON.stringify({ title: 'New Title' }),
      })
      await PATCH(request, { params: { id: 'moment-1' } })

      const query = mockExecuteUserWrite.mock.calls[0][0]
      expect(query).not.toContain('created_at =')
    })
  })

  describe('Error Handling', () => {
    it('should return 400 for invalid JSON body', async () => {
      mockGetServerSession.mockResolvedValue(mockSession)

      const request = new NextRequest('http://localhost:3000/api/moments/moment-1', {
        method: 'PATCH',
        body: 'invalid json',
      })
      const response = await PATCH(request, { params: { id: 'moment-1' } })

      expect(response.status).toBe(400)
    })

    it('should return 500 if database update fails', async () => {
      mockGetServerSession.mockResolvedValue(mockSession)
      mockVerifyNodeOwnership.mockResolvedValue(true)
      mockExecuteUserWrite.mockRejectedValue(new Error('Database error'))

      const request = new NextRequest('http://localhost:3000/api/moments/moment-1', {
        method: 'PATCH',
        body: JSON.stringify({ title: 'New Title' }),
      })
      const response = await PATCH(request, { params: { id: 'moment-1' } })

      expect(response.status).toBe(500)
    })
  })
})

describe('DELETE /api/moments/[id] - Delete Moment', () => {
  const mockSession = createMockSession('user-123', 'test@example.com')

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Authentication', () => {
    it('should return 401 if user is not authenticated', async () => {
      mockGetServerSession.mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/moments/moment-1', {
        method: 'DELETE',
      })
      const response = await DELETE(request, { params: { id: 'moment-1' } })

      expect(response.status).toBe(401)
    })
  })

  describe('Ownership Verification', () => {
    it('should verify ownership before allowing deletion', async () => {
      mockGetServerSession.mockResolvedValue(mockSession)
      mockVerifyNodeOwnership.mockResolvedValue(true)
      mockExecuteUserWrite.mockResolvedValue([])

      const request = new NextRequest('http://localhost:3000/api/moments/moment-1', {
        method: 'DELETE',
      })
      await DELETE(request, { params: { id: 'moment-1' } })

      expect(mockVerifyNodeOwnership).toHaveBeenCalledWith('Moment', 'moment-1', mockSession)
    })

    it('should return 404 if moment does not exist', async () => {
      mockGetServerSession.mockResolvedValue(mockSession)
      mockVerifyNodeOwnership.mockResolvedValue(false)

      const request = new NextRequest('http://localhost:3000/api/moments/nonexistent', {
        method: 'DELETE',
      })
      const response = await DELETE(request, { params: { id: 'nonexistent' } })

      expect(response.status).toBe(404)
    })

    it('should return 404 if moment belongs to different user', async () => {
      mockGetServerSession.mockResolvedValue(mockSession)
      mockVerifyNodeOwnership.mockResolvedValue(false)

      const request = new NextRequest('http://localhost:3000/api/moments/other-user-moment', {
        method: 'DELETE',
      })
      const response = await DELETE(request, { params: { id: 'other-user-moment' } })

      expect(response.status).toBe(404)
    })
  })

  describe('Deletion Operations', () => {
    it('should delete moment successfully', async () => {
      mockGetServerSession.mockResolvedValue(mockSession)
      mockVerifyNodeOwnership.mockResolvedValue(true)
      mockExecuteUserWrite.mockResolvedValue([])

      const request = new NextRequest('http://localhost:3000/api/moments/moment-1', {
        method: 'DELETE',
      })
      const response = await DELETE(request, { params: { id: 'moment-1' } })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.message).toContain('deleted')
    })

    it('should use DETACH DELETE to remove all relationships', async () => {
      mockGetServerSession.mockResolvedValue(mockSession)
      mockVerifyNodeOwnership.mockResolvedValue(true)
      mockExecuteUserWrite.mockResolvedValue([])

      const request = new NextRequest('http://localhost:3000/api/moments/moment-1', {
        method: 'DELETE',
      })
      await DELETE(request, { params: { id: 'moment-1' } })

      expect(mockExecuteUserWrite).toHaveBeenCalled()
      const query = mockExecuteUserWrite.mock.calls[0][0]
      expect(query).toContain('DETACH DELETE')
    })

    it('should include user_id filter in deletion query', async () => {
      mockGetServerSession.mockResolvedValue(mockSession)
      mockVerifyNodeOwnership.mockResolvedValue(true)
      mockExecuteUserWrite.mockResolvedValue([])

      const request = new NextRequest('http://localhost:3000/api/moments/moment-1', {
        method: 'DELETE',
      })
      await DELETE(request, { params: { id: 'moment-1' } })

      const query = mockExecuteUserWrite.mock.calls[0][0]
      expect(query).toContain('user_id: $userId')
    })
  })

  describe('Cascade Behavior', () => {
    it('should not delete related Characters, only relationships', async () => {
      mockGetServerSession.mockResolvedValue(mockSession)
      mockVerifyNodeOwnership.mockResolvedValue(true)
      mockExecuteUserWrite.mockResolvedValue([])

      const request = new NextRequest('http://localhost:3000/api/moments/moment-1', {
        method: 'DELETE',
      })
      await DELETE(request, { params: { id: 'moment-1' } })

      // Query should only delete the Moment node, DETACH will remove relationships
      const query = mockExecuteUserWrite.mock.calls[0][0]
      expect(query).toContain('DETACH DELETE')
      expect(query).not.toContain('DELETE (c:Character)')
    })

    it('should not delete related Locations, only relationships', async () => {
      mockGetServerSession.mockResolvedValue(mockSession)
      mockVerifyNodeOwnership.mockResolvedValue(true)
      mockExecuteUserWrite.mockResolvedValue([])

      const request = new NextRequest('http://localhost:3000/api/moments/moment-1', {
        method: 'DELETE',
      })
      await DELETE(request, { params: { id: 'moment-1' } })

      const query = mockExecuteUserWrite.mock.calls[0][0]
      expect(query).not.toContain('DELETE (l:Location)')
    })
  })

  describe('Error Handling', () => {
    it('should return 500 if database deletion fails', async () => {
      mockGetServerSession.mockResolvedValue(mockSession)
      mockVerifyNodeOwnership.mockResolvedValue(true)
      mockExecuteUserWrite.mockRejectedValue(new Error('Database error'))

      const request = new NextRequest('http://localhost:3000/api/moments/moment-1', {
        method: 'DELETE',
      })
      const response = await DELETE(request, { params: { id: 'moment-1' } })

      expect(response.status).toBe(500)
    })
  })
})
