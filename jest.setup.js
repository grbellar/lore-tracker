// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Mock environment variables
process.env.NEXTAUTH_SECRET = 'test-secret-key-for-jest'
process.env.NEXTAUTH_URL = 'http://localhost:3000'
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'
process.env.NEO4J_URI = 'bolt://localhost:7687'
process.env.NEO4J_USER = 'neo4j'
process.env.NEO4J_PASSWORD = 'test'

// Set up Next.js Web API globals for testing
import { TextEncoder, TextDecoder } from 'util'
import { ReadableStream, TransformStream } from 'stream/web'

global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder
global.ReadableStream = ReadableStream
global.TransformStream = TransformStream

// Set up fetch, Request, Response, Headers for Next.js API testing
if (!global.fetch) {
  global.fetch = jest.fn()
  global.Request = jest.fn()
  global.Response = jest.fn()
  global.Headers = jest.fn()
}

// Mock console methods to reduce noise in tests
// You can remove these if you want to see all logs during testing
global.console = {
  ...console,
  // Keep error logs visible as they're important for debugging
  error: jest.fn(),
  // Optionally suppress other logs
  warn: jest.fn(),
  log: jest.fn(),
}
