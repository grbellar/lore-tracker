/**
 * Integration Test Suite: Moments API Full Workflow
 *
 * End-to-end tests for complete moment lifecycle
 * All tests should FAIL initially until the feature is implemented
 */

import { executeUserQuery, executeUserWrite, verifyNodeOwnership } from '@/lib/neo4j-auth'
import { createMockSession } from '@/__tests__/utils/session-mock'
import { getServerSession } from 'next-auth/next'

jest.mock('next-auth/next')
jest.mock('@/lib/neo4j')

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>

describe('Moments API: Full Workflow Integration Tests', () => {
  const mockSession = createMockSession('user-123', 'test@example.com')

  // Mock Neo4j session
  let mockNeo4jSession: any
  let mockMoments: any[]

  beforeEach(() => {
    jest.clearAllMocks()
    mockMoments = []

    mockNeo4jSession = {
      run: jest.fn(async (query: string, params: any) => {
        // Create moment
        if (query.includes('CREATE') && query.includes(':Moment')) {
          const moment = {
            id: params.id,
            user_id: params.userId,
            title: params.title,
            content: params.content || '',
            summary: params.summary || null,
            preview: params.preview || '',
            timestamp: params.timestamp || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }
          mockMoments.push(moment)
          return {
            records: [{ keys: ['m'], get: () => ({ properties: moment }) }],
          }
        }

        // List moments
        if (query.includes('MATCH') && query.includes(':Moment') && !query.includes('id: $id')) {
          return {
            records: mockMoments.map(m => ({
              keys: ['m'],
              get: () => ({ properties: m }),
            })),
          }
        }

        // Get single moment
        if (query.includes('MATCH') && query.includes('id: $id')) {
          const moment = mockMoments.find(m => m.id === params.id)
          if (moment) {
            return {
              records: [{ keys: ['m'], get: () => ({ properties: moment }) }],
            }
          }
          return { records: [] }
        }

        // Update moment
        if (query.includes('SET')) {
          const moment = mockMoments.find(m => m.id === params.id)
          if (moment) {
            Object.assign(moment, {
              title: params.title !== undefined ? params.title : moment.title,
              content: params.content !== undefined ? params.content : moment.content,
              summary: params.summary !== undefined ? params.summary : moment.summary,
              preview: params.preview !== undefined ? params.preview : moment.preview,
              timestamp: params.timestamp !== undefined ? params.timestamp : moment.timestamp,
              updated_at: new Date().toISOString(),
            })
            return {
              records: [{ keys: ['m'], get: () => ({ properties: moment }) }],
            }
          }
          return { records: [] }
        }

        // Delete moment
        if (query.includes('DETACH DELETE')) {
          const index = mockMoments.findIndex(m => m.id === params.id)
          if (index !== -1) {
            mockMoments.splice(index, 1)
          }
          return { records: [] }
        }

        // Ownership verification
        if (query.includes('count(n) > 0 as exists')) {
          const exists = mockMoments.some(m => m.id === params.nodeId && m.user_id === params.userId)
          return {
            records: [{ get: () => exists }],
          }
        }

        return { records: [] }
      }),
      executeWrite: jest.fn(async (txFunc: Function) => {
        const tx = { run: mockNeo4jSession.run }
        return await txFunc(tx)
      }),
      close: jest.fn(),
    }

    const { getSession } = require('@/lib/neo4j')
    getSession.mockReturnValue(mockNeo4jSession)
    mockGetServerSession.mockResolvedValue(mockSession)
  })

  describe('Complete CRUD Workflow', () => {
    it('should create, read, update, and delete a moment', async () => {
      // 1. CREATE
      const createResult = await executeUserWrite(
        `CREATE (m:Moment {
          id: $id,
          user_id: $userId,
          title: $title,
          content: $content,
          summary: $summary,
          preview: $preview,
          timestamp: $timestamp,
          created_at: datetime(),
          updated_at: datetime()
        }) RETURN m`,
        {
          id: 'moment-workflow-1',
          title: 'Test Moment',
          content: 'This is the original content',
          summary: 'Original summary',
          preview: 'This is the original content',
          timestamp: null,
        }
      )

      expect(createResult).toHaveLength(1)
      expect(createResult[0].title).toBe('Test Moment')

      // 2. READ (List)
      const listResult = await executeUserQuery(
        'MATCH (m:Moment {user_id: $userId}) RETURN m',
        {}
      )
      expect(listResult).toHaveLength(1)

      // 3. READ (Single)
      const readResult = await executeUserQuery(
        'MATCH (m:Moment {id: $id, user_id: $userId}) RETURN m',
        { id: 'moment-workflow-1' }
      )
      expect(readResult).toHaveLength(1)
      expect(readResult[0].content).toBe('This is the original content')

      // 4. UPDATE
      const canUpdate = await verifyNodeOwnership('Moment', 'moment-workflow-1')
      expect(canUpdate).toBe(true)

      const updateResult = await executeUserWrite(
        `MATCH (m:Moment {id: $id, user_id: $userId})
         SET m.title = $title,
             m.content = $content,
             m.updated_at = datetime()
         RETURN m`,
        {
          id: 'moment-workflow-1',
          title: 'Updated Moment',
          content: 'This is the updated content',
        }
      )
      expect(updateResult[0].title).toBe('Updated Moment')
      expect(updateResult[0].content).toBe('This is the updated content')

      // 5. DELETE
      const canDelete = await verifyNodeOwnership('Moment', 'moment-workflow-1')
      expect(canDelete).toBe(true)

      await executeUserWrite(
        'MATCH (m:Moment {id: $id, user_id: $userId}) DETACH DELETE m',
        { id: 'moment-workflow-1' }
      )

      // Verify deletion
      const afterDelete = await executeUserQuery(
        'MATCH (m:Moment {user_id: $userId}) RETURN m',
        {}
      )
      expect(afterDelete).toHaveLength(0)
    })
  })

  describe('Multiple Moments Management', () => {
    it('should handle creating and managing multiple moments', async () => {
      // Create 3 moments
      for (let i = 1; i <= 3; i++) {
        await executeUserWrite(
          `CREATE (m:Moment {
            id: $id,
            user_id: $userId,
            title: $title,
            content: $content,
            summary: $summary,
            preview: $preview,
            timestamp: $timestamp,
            created_at: datetime(),
            updated_at: datetime()
          }) RETURN m`,
          {
            id: `moment-multi-${i}`,
            title: `Moment ${i}`,
            content: `Content ${i}`,
            summary: null,
            preview: `Content ${i}`,
            timestamp: null,
          }
        )
      }

      // List all moments
      const allMoments = await executeUserQuery(
        'MATCH (m:Moment {user_id: $userId}) RETURN m',
        {}
      )
      expect(allMoments).toHaveLength(3)

      // Update one moment
      await executeUserWrite(
        `MATCH (m:Moment {id: $id, user_id: $userId})
         SET m.title = $title, m.updated_at = datetime()
         RETURN m`,
        { id: 'moment-multi-2', title: 'Updated Moment 2' }
      )

      // Delete one moment
      await executeUserWrite(
        'MATCH (m:Moment {id: $id, user_id: $userId}) DETACH DELETE m',
        { id: 'moment-multi-3' }
      )

      // Verify final state
      const finalMoments = await executeUserQuery(
        'MATCH (m:Moment {user_id: $userId}) RETURN m',
        {}
      )
      expect(finalMoments).toHaveLength(2)
      expect(finalMoments.find(m => m.id === 'moment-multi-2')?.title).toBe('Updated Moment 2')
      expect(finalMoments.find(m => m.id === 'moment-multi-3')).toBeUndefined()
    })
  })

  describe('Preview Generation Workflow', () => {
    it('should auto-generate preview from long content', async () => {
      const longContent = 'A'.repeat(500)

      const result = await executeUserWrite(
        `CREATE (m:Moment {
          id: $id,
          user_id: $userId,
          title: $title,
          content: $content,
          summary: $summary,
          preview: $preview,
          timestamp: $timestamp,
          created_at: datetime(),
          updated_at: datetime()
        }) RETURN m`,
        {
          id: 'moment-preview',
          title: 'Long Content Moment',
          content: longContent,
          summary: null,
          preview: longContent.substring(0, 300), // Auto-generated preview
          timestamp: null,
        }
      )

      expect(result[0].preview).toHaveLength(300)
      expect(result[0].content).toHaveLength(500)
    })

    it('should update preview when content is updated', async () => {
      // Create moment with short content
      await executeUserWrite(
        `CREATE (m:Moment {
          id: $id,
          user_id: $userId,
          title: $title,
          content: $content,
          summary: $summary,
          preview: $preview,
          timestamp: $timestamp,
          created_at: datetime(),
          updated_at: datetime()
        }) RETURN m`,
        {
          id: 'moment-preview-update',
          title: 'Preview Update Test',
          content: 'Short content',
          summary: null,
          preview: 'Short content',
          timestamp: null,
        }
      )

      // Update with long content
      const newLongContent = 'B'.repeat(400)
      const updatedResult = await executeUserWrite(
        `MATCH (m:Moment {id: $id, user_id: $userId})
         SET m.content = $content,
             m.preview = $preview,
             m.updated_at = datetime()
         RETURN m`,
        {
          id: 'moment-preview-update',
          content: newLongContent,
          preview: newLongContent.substring(0, 300),
        }
      )

      expect(updatedResult[0].preview).toHaveLength(300)
      expect(updatedResult[0].content).toHaveLength(400)
    })
  })

  describe('Timestamp Management', () => {
    it('should handle in-world timestamps', async () => {
      const result = await executeUserWrite(
        `CREATE (m:Moment {
          id: $id,
          user_id: $userId,
          title: $title,
          content: $content,
          summary: $summary,
          preview: $preview,
          timestamp: $timestamp,
          created_at: datetime(),
          updated_at: datetime()
        }) RETURN m`,
        {
          id: 'moment-timestamp',
          title: 'Timestamped Event',
          content: 'The battle happened at dawn',
          summary: null,
          preview: 'The battle happened at dawn',
          timestamp: '2024-06-01T06:00:00Z',
        }
      )

      expect(result[0].timestamp).toBe('2024-06-01T06:00:00Z')

      // Update timestamp
      const updatedResult = await executeUserWrite(
        `MATCH (m:Moment {id: $id, user_id: $userId})
         SET m.timestamp = $timestamp, m.updated_at = datetime()
         RETURN m`,
        {
          id: 'moment-timestamp',
          timestamp: '2024-06-01T07:00:00Z',
        }
      )

      expect(updatedResult[0].timestamp).toBe('2024-06-01T07:00:00Z')
    })

    it('should handle moments without in-world timestamps', async () => {
      const result = await executeUserWrite(
        `CREATE (m:Moment {
          id: $id,
          user_id: $userId,
          title: $title,
          content: $content,
          summary: $summary,
          preview: $preview,
          timestamp: $timestamp,
          created_at: datetime(),
          updated_at: datetime()
        }) RETURN m`,
        {
          id: 'moment-no-timestamp',
          title: 'Timeless Event',
          content: 'No specific time',
          summary: null,
          preview: 'No specific time',
          timestamp: null,
        }
      )

      expect(result[0].timestamp).toBeNull()
    })
  })

  describe('Summary Management', () => {
    it('should allow optional summaries', async () => {
      // Create without summary
      const withoutSummary = await executeUserWrite(
        `CREATE (m:Moment {
          id: $id,
          user_id: $userId,
          title: $title,
          content: $content,
          summary: $summary,
          preview: $preview,
          timestamp: $timestamp,
          created_at: datetime(),
          updated_at: datetime()
        }) RETURN m`,
        {
          id: 'moment-no-summary',
          title: 'No Summary',
          content: 'Content without summary',
          summary: null,
          preview: 'Content without summary',
          timestamp: null,
        }
      )
      expect(withoutSummary[0].summary).toBeNull()

      // Create with summary
      const withSummary = await executeUserWrite(
        `CREATE (m:Moment {
          id: $id,
          user_id: $userId,
          title: $title,
          content: $content,
          summary: $summary,
          preview: $preview,
          timestamp: $timestamp,
          created_at: datetime(),
          updated_at: datetime()
        }) RETURN m`,
        {
          id: 'moment-with-summary',
          title: 'With Summary',
          content: 'Full content here',
          summary: 'Brief summary',
          preview: 'Full content here',
          timestamp: null,
        }
      )
      expect(withSummary[0].summary).toBe('Brief summary')

      // Add summary to existing moment
      await executeUserWrite(
        `MATCH (m:Moment {id: $id, user_id: $userId})
         SET m.summary = $summary, m.updated_at = datetime()
         RETURN m`,
        { id: 'moment-no-summary', summary: 'Added later' }
      )

      const updated = await executeUserQuery(
        'MATCH (m:Moment {id: $id, user_id: $userId}) RETURN m',
        { id: 'moment-no-summary' }
      )
      expect(updated[0].summary).toBe('Added later')
    })
  })

  describe('Error Recovery', () => {
    it('should handle failed updates gracefully', async () => {
      // Create moment
      await executeUserWrite(
        `CREATE (m:Moment {
          id: $id,
          user_id: $userId,
          title: $title,
          content: $content,
          summary: $summary,
          preview: $preview,
          timestamp: $timestamp,
          created_at: datetime(),
          updated_at: datetime()
        }) RETURN m`,
        {
          id: 'moment-error-recovery',
          title: 'Original Title',
          content: 'Original',
          summary: null,
          preview: 'Original',
          timestamp: null,
        }
      )

      // Attempt to update non-existent moment (should not affect existing moment)
      const updateResult = await executeUserWrite(
        `MATCH (m:Moment {id: $id, user_id: $userId})
         SET m.title = $title, m.updated_at = datetime()
         RETURN m`,
        { id: 'nonexistent-moment', title: 'New Title' }
      )
      expect(updateResult).toHaveLength(0)

      // Verify original moment unchanged
      const original = await executeUserQuery(
        'MATCH (m:Moment {id: $id, user_id: $userId}) RETURN m',
        { id: 'moment-error-recovery' }
      )
      expect(original[0].title).toBe('Original Title')
    })

    it('should handle failed deletions gracefully', async () => {
      // Create moment
      await executeUserWrite(
        `CREATE (m:Moment {
          id: $id,
          user_id: $userId,
          title: $title,
          content: $content,
          summary: $summary,
          preview: $preview,
          timestamp: $timestamp,
          created_at: datetime(),
          updated_at: datetime()
        }) RETURN m`,
        {
          id: 'moment-delete-error',
          title: 'To Keep',
          content: 'Keep me',
          summary: null,
          preview: 'Keep me',
          timestamp: null,
        }
      )

      // Attempt to delete non-existent moment
      await executeUserWrite(
        'MATCH (m:Moment {id: $id, user_id: $userId}) DETACH DELETE m',
        { id: 'nonexistent-moment' }
      )

      // Verify original moment still exists
      const moments = await executeUserQuery(
        'MATCH (m:Moment {user_id: $userId}) RETURN m',
        {}
      )
      expect(moments).toHaveLength(1)
      expect(moments[0].title).toBe('To Keep')
    })
  })

  describe('Audit Timestamps', () => {
    it('should maintain created_at and updated_at timestamps', async () => {
      // Create moment
      const created = await executeUserWrite(
        `CREATE (m:Moment {
          id: $id,
          user_id: $userId,
          title: $title,
          content: $content,
          summary: $summary,
          preview: $preview,
          timestamp: $timestamp,
          created_at: datetime(),
          updated_at: datetime()
        }) RETURN m`,
        {
          id: 'moment-audit',
          title: 'Audit Test',
          content: 'Test',
          summary: null,
          preview: 'Test',
          timestamp: null,
        }
      )

      const createdAt = created[0].created_at
      const initialUpdatedAt = created[0].updated_at

      expect(createdAt).toBeDefined()
      expect(initialUpdatedAt).toBeDefined()

      // Wait a bit then update
      await new Promise(resolve => setTimeout(resolve, 10))

      const updated = await executeUserWrite(
        `MATCH (m:Moment {id: $id, user_id: $userId})
         SET m.title = $title, m.updated_at = datetime()
         RETURN m`,
        { id: 'moment-audit', title: 'Updated Title' }
      )

      // created_at should stay the same
      expect(updated[0].created_at).toBe(createdAt)

      // updated_at should change
      expect(updated[0].updated_at).not.toBe(initialUpdatedAt)
    })
  })
})
