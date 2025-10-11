import { User } from '@prisma/client'

/**
 * Test data factories for creating consistent test data
 */

/**
 * Create a mock User for testing
 */
export function createMockUser(overrides?: Partial<User>): User {
  return {
    id: 'test-user-id',
    name: 'Test User',
    email: 'test@example.com',
    emailVerified: null,
    image: null,
    password: '$2a$10$mocked.hashed.password.here',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  }
}

/**
 * Create multiple mock users for isolation testing
 */
export function createMockUsers(count: number = 2): User[] {
  return Array.from({ length: count }, (_, i) =>
    createMockUser({
      id: `user-${i + 1}`,
      email: `user${i + 1}@example.com`,
      name: `Test User ${i + 1}`,
    })
  )
}

/**
 * Create a mock Neo4j Character node
 */
export function createMockCharacter(userId: string, overrides?: Record<string, any>) {
  return {
    id: `char-${Date.now()}`,
    user_id: userId,
    name: 'Test Character',
    description: 'A test character',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  }
}

/**
 * Create a mock Neo4j Location node
 */
export function createMockLocation(userId: string, overrides?: Record<string, any>) {
  return {
    id: `loc-${Date.now()}`,
    user_id: userId,
    name: 'Test Location',
    description: 'A test location',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  }
}

/**
 * Create a mock Neo4j Moment node
 */
export function createMockMoment(userId: string, overrides?: Record<string, any>) {
  return {
    id: `moment-${Date.now()}`,
    user_id: userId,
    title: 'Test Moment',
    content: 'Test moment content',
    summary: 'Test summary',
    preview: 'Test preview',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  }
}

/**
 * Create signup request data
 */
export function createSignupData(overrides?: Record<string, any>) {
  return {
    name: 'New User',
    email: 'newuser@example.com',
    password: 'password123',
    ...overrides,
  }
}

/**
 * Create login credentials
 */
export function createLoginCredentials(overrides?: Record<string, any>) {
  return {
    email: 'test@example.com',
    password: 'password123',
    ...overrides,
  }
}

export default {
  createMockUser,
  createMockUsers,
  createMockCharacter,
  createMockLocation,
  createMockMoment,
  createSignupData,
  createLoginCredentials,
}
