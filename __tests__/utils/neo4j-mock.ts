import { Session, Driver, ManagedTransaction, Result, Record } from 'neo4j-driver'
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended'

// Create deep mocks for Neo4j types
export const neo4jSessionMock = mockDeep<Session>()
export const neo4jDriverMock = mockDeep<Driver>()
export const neo4jTxMock = mockDeep<ManagedTransaction>()

// Helper to create a mock Neo4j result
export function createMockNeo4jResult(records: any[] = [], keys: string[] = []): Result {
  const mockRecords = records.map(recordData => {
    const record = mockDeep<Record>()
    record.keys = keys.length > 0 ? keys : Object.keys(recordData)

    // Mock the get method to return data
    record.get.mockImplementation((key: string | number) => {
      if (typeof key === 'number') {
        return recordData[record.keys[key]]
      }
      return recordData[key]
    })

    return record
  })

  return {
    records: mockRecords,
    summary: {} as any,
  } as Result
}

// Helper to create a mock Neo4j node with properties
export function createMockNeo4jNode(properties: Record<string, any>) {
  return {
    properties,
    labels: [],
    identity: { low: 1, high: 0 },
  }
}

// Reset mocks before each test
beforeEach(() => {
  mockReset(neo4jSessionMock)
  mockReset(neo4jDriverMock)
  mockReset(neo4jTxMock)
})

// Mock the neo4j module
jest.mock('@/lib/neo4j', () => ({
  __esModule: true,
  driver: neo4jDriverMock,
  getSession: jest.fn(() => neo4jSessionMock),
  verifyConnection: jest.fn(async () => true),
}))

export default {
  session: neo4jSessionMock,
  driver: neo4jDriverMock,
  tx: neo4jTxMock,
  createMockNeo4jResult,
  createMockNeo4jNode,
}
