import { PrismaClient } from '@prisma/client'
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended'

// Create a deep mock of PrismaClient
export const prismaMock = mockDeep<PrismaClient>() as unknown as DeepMockProxy<PrismaClient>

// Reset mocks before each test
beforeEach(() => {
  mockReset(prismaMock)
})

// Mock the prisma module
jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  prisma: prismaMock,
}))

export default prismaMock
