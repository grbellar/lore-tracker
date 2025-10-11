import neo4j, { Driver, Session } from 'neo4j-driver'

// Global singleton pattern for Neo4j driver
const globalForNeo4j = globalThis as unknown as {
  driver: Driver | undefined
}

// Create Neo4j driver singleton
const createDriver = (): Driver => {
  const uri = process.env.NEO4J_URI || 'bolt://localhost:7687'
  const user = process.env.NEO4J_USER || 'neo4j'
  const password = process.env.NEO4J_PASSWORD || 'secret'

  if (!uri || !user || !password) {
    throw new Error('Missing Neo4j connection credentials. Check NEO4J_URI, NEO4J_USER, and NEO4J_PASSWORD environment variables.')
  }

  return neo4j.driver(uri, neo4j.auth.basic(user, password), {
    maxConnectionPoolSize: 50,
    connectionAcquisitionTimeout: 30000, // 30 seconds
    maxTransactionRetryTime: 30000, // 30 seconds
  })
}

// Export the driver singleton
export const driver = globalForNeo4j.driver ?? createDriver()

// Store driver in global for development hot-reload
if (process.env.NODE_ENV !== 'production') {
  globalForNeo4j.driver = driver
}

/**
 * Get a Neo4j session for running queries
 * @param database - Optional database name (defaults to 'neo4j')
 * @returns Neo4j Session
 */
export const getSession = (database: string = 'neo4j'): Session => {
  return driver.session({ database })
}

/**
 * Verify Neo4j connection is working
 * @returns Promise that resolves to true if connection is successful
 */
export const verifyConnection = async (): Promise<boolean> => {
  const session = getSession()
  try {
    const result = await session.run('RETURN 1 as num')
    return result.records[0].get('num').toNumber() === 1
  } catch (error) {
    console.error('Neo4j connection verification failed:', error)
    return false
  } finally {
    await session.close()
  }
}

/**
 * Close the Neo4j driver connection
 * Should be called when shutting down the application
 */
export const closeDriver = async (): Promise<void> => {
  await driver.close()
}

// Export neo4j types for convenience
export type { Driver, Session, QueryResult, RecordShape } from 'neo4j-driver'
