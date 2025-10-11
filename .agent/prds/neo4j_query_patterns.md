# Neo4j Query Patterns and Best Practices

**Related docs:**
- [Database Specification](./database_spec.md)
- [Authentication System](../System/authentication_system.md)
- [Project Architecture](../System/project_architecture.md)

## Overview

This document provides standard operating procedures for working with Neo4j in the Lore Tracker application. All Neo4j operations MUST follow these patterns to ensure data isolation and security.

## Core Principles

### 1. User Isolation is Mandatory
- Every node MUST have a `user_id` property
- Every relationship MUST have a `user_id` property
- Every query MUST filter by `user_id`
- Never query or manipulate data without user context

### 2. Server-Side Only
- All Neo4j operations MUST be in API routes or server components
- Never expose Neo4j driver or queries to client components
- Never send Neo4j credentials to the client

### 3. Authentication Required
- Always verify session before Neo4j operations
- Extract `user_id` from authenticated session
- Return 401 Unauthorized if session is invalid

### 4. Use Helper Functions
- Always use `executeUserQuery` and `executeUserWrite` from `lib/neo4j-auth.ts`
- Never bypass user isolation helpers
- These functions automatically inject `userId` parameter

## API Route Pattern

### Standard API Route Structure

```typescript
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { executeUserQuery, executeUserWrite } from '@/lib/neo4j-auth'

export async function GET(req: Request) {
  // 1. Verify authentication
  const session = await getServerSession()
  if (!session) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    // 2. Execute query with user isolation
    const results = await executeUserQuery(
      'MATCH (n:NodeType {user_id: $userId}) RETURN n',
      {},
      session
    )

    // 3. Return results
    return NextResponse.json({ data: results })
  } catch (error) {
    console.error('Query failed:', error)
    return NextResponse.json(
      { error: 'Query failed' },
      { status: 500 }
    )
  }
}
```

## Common Query Patterns

### Create Node with User Isolation

```typescript
export async function POST(req: Request) {
  const session = await getServerSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { name, description } = body

  if (!name) {
    return NextResponse.json(
      { error: 'Name is required' },
      { status: 400 }
    )
  }

  try {
    const result = await executeUserWrite(
      `CREATE (c:Character {
        id: $id,
        user_id: $userId,
        name: $name,
        description: $description,
        created_at: datetime(),
        updated_at: datetime()
      })
      RETURN c`,
      {
        id: crypto.randomUUID(),
        name,
        description: description || '',
      },
      session
    )

    return NextResponse.json(
      { data: result[0] },
      { status: 201 }
    )
  } catch (error) {
    console.error('Character creation failed:', error)
    return NextResponse.json(
      { error: 'Creation failed' },
      { status: 500 }
    )
  }
}
```

### Get All Nodes of a Type

```typescript
export async function GET(req: Request) {
  const session = await getServerSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const characters = await executeUserQuery(
      `MATCH (c:Character {user_id: $userId})
       RETURN c
       ORDER BY c.name ASC`,
      {},
      session
    )

    return NextResponse.json({ data: characters })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch characters' },
      { status: 500 }
    )
  }
}
```

### Get Single Node by ID

```typescript
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = params

  try {
    const result = await executeUserQuery(
      `MATCH (c:Character {id: $id, user_id: $userId})
       RETURN c`,
      { id },
      session
    )

    if (result.length === 0) {
      return NextResponse.json(
        { error: 'Character not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ data: result[0] })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch character' },
      { status: 500 }
    )
  }
}
```

### Update Node

```typescript
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = params
  const body = await req.json()
  const { name, description } = body

  try {
    // Verify ownership first
    const canEdit = await verifyNodeOwnership('Character', id, session)
    if (!canEdit) {
      return NextResponse.json(
        { error: 'Character not found or unauthorized' },
        { status: 404 }
      )
    }

    // Update node
    const result = await executeUserWrite(
      `MATCH (c:Character {id: $id, user_id: $userId})
       SET c.name = $name,
           c.description = $description,
           c.updated_at = datetime()
       RETURN c`,
      { id, name, description },
      session
    )

    return NextResponse.json({ data: result[0] })
  } catch (error) {
    console.error('Character update failed:', error)
    return NextResponse.json(
      { error: 'Update failed' },
      { status: 500 }
    )
  }
}
```

### Delete Node

```typescript
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = params

  try {
    // Verify ownership first
    const canDelete = await verifyNodeOwnership('Character', id, session)
    if (!canDelete) {
      return NextResponse.json(
        { error: 'Character not found or unauthorized' },
        { status: 404 }
      )
    }

    // Delete node and all relationships
    await executeUserWrite(
      `MATCH (c:Character {id: $id, user_id: $userId})
       DETACH DELETE c`,
      { id },
      session
    )

    return NextResponse.json({
      success: true,
      message: 'Character deleted',
    })
  } catch (error) {
    console.error('Character deletion failed:', error)
    return NextResponse.json(
      { error: 'Deletion failed' },
      { status: 500 }
    )
  }
}
```

### Create Relationship with User Isolation

```typescript
export async function POST(req: Request) {
  const session = await getServerSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { fromCharacterId, toCharacterId, relationshipType, context } = body

  if (!fromCharacterId || !toCharacterId || !relationshipType) {
    return NextResponse.json(
      { error: 'fromCharacterId, toCharacterId, and relationshipType are required' },
      { status: 400 }
    )
  }

  try {
    const result = await executeUserWrite(
      `MATCH (c1:Character {id: $fromId, user_id: $userId})
       MATCH (c2:Character {id: $toId, user_id: $userId})
       CREATE (c1)-[r:KNOWS {
         user_id: $userId,
         relationship_type: $relType,
         context: $context,
         since: datetime()
       }]->(c2)
       RETURN r, c1, c2`,
      {
        fromId: fromCharacterId,
        toId: toCharacterId,
        relType: relationshipType,
        context: context || '',
      },
      session
    )

    return NextResponse.json(
      { data: result[0] },
      { status: 201 }
    )
  } catch (error) {
    console.error('Relationship creation failed:', error)
    return NextResponse.json(
      { error: 'Failed to create relationship' },
      { status: 500 }
    )
  }
}
```

### Get Node with Relationships

```typescript
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = params

  try {
    const result = await executeUserQuery(
      `MATCH (c:Character {id: $id, user_id: $userId})
       OPTIONAL MATCH (c)-[:PARTICIPATED_IN]->(m:Moment {user_id: $userId})
       OPTIONAL MATCH (c)-[:LOCATED_AT]->(l:Location {user_id: $userId})
       OPTIONAL MATCH (c)-[:OWNS]->(i:Item {user_id: $userId})
       OPTIONAL MATCH (c)-[r:KNOWS]->(other:Character {user_id: $userId})
       RETURN c,
         collect(DISTINCT m) as moments,
         collect(DISTINCT l) as locations,
         collect(DISTINCT i) as items,
         collect(DISTINCT {character: other, relationship: r}) as relationships`,
      { id },
      session
    )

    if (result.length === 0) {
      return NextResponse.json(
        { error: 'Character not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ data: result[0] })
  } catch (error) {
    console.error('Failed to fetch character with relationships:', error)
    return NextResponse.json(
      { error: 'Query failed' },
      { status: 500 }
    )
  }
}
```

## Timeline Queries

### Get Timeline (Preview Only - Lightweight)

```typescript
export async function GET(req: Request) {
  const session = await getServerSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Get timeline starting from the first moment (no incoming AFTER)
    const timeline = await executeUserQuery(
      `MATCH (start:Moment {user_id: $userId})
       WHERE NOT (:Moment)-[:AFTER]->(start)
       MATCH path = (start)-[:AFTER*0..]->(m:Moment)
       RETURN m.id as id,
              m.title as title,
              m.preview as preview,
              m.summary as summary,
              m.timestamp as timestamp,
              m.created_at as created_at
       ORDER BY length(path)`,
      {},
      session
    )

    return NextResponse.json({ data: timeline })
  } catch (error) {
    console.error('Failed to fetch timeline:', error)
    return NextResponse.json(
      { error: 'Failed to fetch timeline' },
      { status: 500 }
    )
  }
}
```

### Get Single Moment (Full Content)

```typescript
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = params

  try {
    // Fetch full moment including content field
    const result = await executeUserQuery(
      `MATCH (m:Moment {id: $id, user_id: $userId})
       OPTIONAL MATCH (m)<-[:PARTICIPATED_IN]-(c:Character {user_id: $userId})
       OPTIONAL MATCH (m)-[:OCCURRED_AT]->(l:Location {user_id: $userId})
       RETURN m,
              collect(DISTINCT c) as characters,
              collect(DISTINCT l) as locations`,
      { id },
      session
    )

    if (result.length === 0) {
      return NextResponse.json(
        { error: 'Moment not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ data: result[0] })
  } catch (error) {
    console.error('Failed to fetch moment:', error)
    return NextResponse.json(
      { error: 'Failed to fetch moment' },
      { status: 500 }
    )
  }
}
```

## Search Patterns

### Search by Name (with Pagination)

```typescript
export async function GET(req: Request) {
  const session = await getServerSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const query = searchParams.get('q') || ''
  const limit = parseInt(searchParams.get('limit') || '20')
  const skip = parseInt(searchParams.get('skip') || '0')

  try {
    const results = await executeUserQuery(
      `MATCH (c:Character {user_id: $userId})
       WHERE c.name CONTAINS $query
       RETURN c
       ORDER BY c.name ASC
       SKIP $skip
       LIMIT $limit`,
      { query, skip, limit },
      session
    )

    return NextResponse.json({ data: results })
  } catch (error) {
    console.error('Search failed:', error)
    return NextResponse.json(
      { error: 'Search failed' },
      { status: 500 }
    )
  }
}
```

## Error Handling Best Practices

### Standard Error Response Format

```typescript
try {
  // Query logic
} catch (error) {
  console.error('Operation failed:', error)

  // Handle specific Neo4j errors
  if (error instanceof Error) {
    if (error.message.includes('constraint')) {
      return NextResponse.json(
        { error: 'Duplicate entry' },
        { status: 409 }
      )
    }

    if (error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
  }

  // Generic error
  return NextResponse.json(
    { error: 'Operation failed' },
    { status: 500 }
  )
}
```

## Security Checklist

Before deploying any Neo4j API route, verify:

- [ ] Session verification at the start of the function
- [ ] Returns 401 if no session
- [ ] Uses `executeUserQuery` or `executeUserWrite` (not raw driver)
- [ ] All queries include `user_id` filter
- [ ] Ownership verified before updates/deletes (via `verifyNodeOwnership`)
- [ ] Input validation for required fields
- [ ] Proper error handling with appropriate status codes
- [ ] No sensitive data exposed in error messages
- [ ] No Neo4j connection details exposed to client

## Performance Best Practices

### 1. Use Indexes
All user isolation queries benefit from indexes defined in `neo4j/init.cypher`:
- `user_id` indexes on all node labels
- Composite indexes for common patterns (e.g., `user_id` + `name`)

### 2. Limit Result Sets
Always use pagination for potentially large result sets:
```cypher
MATCH (c:Character {user_id: $userId})
RETURN c
ORDER BY c.name
SKIP $skip
LIMIT $limit
```

### 3. Avoid Loading Large Text Fields
For list/timeline views, exclude large text fields:
```cypher
// Good - only fetch needed fields
RETURN m.id, m.title, m.preview

// Bad - fetches entire node including large content field
RETURN m
```

### 4. Limit Relationship Traversal Depth
Avoid deep traversals without limits:
```cypher
// Good - limited depth
MATCH path = (start)-[:KNOWS*1..3]->(end)

// Bad - unbounded traversal
MATCH path = (start)-[:KNOWS*]->(end)
```

## Testing Patterns

### Test Neo4j Integration

Use the test endpoint to verify integration:
```bash
# Test connection and user isolation
curl http://localhost:3000/api/neo4j/test \
  -H "Cookie: next-auth.session-token=your-token"

# Create test character
curl -X POST http://localhost:3000/api/neo4j/test \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=your-token" \
  -d '{"name":"Test Character","description":"Test"}'

# Clean up test data
curl -X DELETE http://localhost:3000/api/neo4j/test \
  -H "Cookie: next-auth.session-token=your-token"
```

## Common Mistakes to Avoid

### ❌ DON'T: Query without user_id filter
```typescript
// WRONG - no user isolation
const result = await session.run(
  'MATCH (c:Character) RETURN c'
)
```

### ✅ DO: Always filter by user_id
```typescript
// CORRECT - user isolation enforced
const result = await executeUserQuery(
  'MATCH (c:Character {user_id: $userId}) RETURN c',
  {}
)
```

### ❌ DON'T: Use raw Neo4j session directly
```typescript
// WRONG - bypasses user isolation helpers
import { getSession } from '@/lib/neo4j'
const session = getSession()
const result = await session.run(query, params)
```

### ✅ DO: Use helper functions
```typescript
// CORRECT - automatic user isolation
import { executeUserQuery } from '@/lib/neo4j-auth'
const result = await executeUserQuery(query, params)
```

### ❌ DON'T: Skip ownership verification
```typescript
// WRONG - no ownership check before deletion
await executeUserWrite(
  'MATCH (c:Character {id: $id}) DETACH DELETE c',
  { id }
)
```

### ✅ DO: Verify ownership first
```typescript
// CORRECT - verify ownership before deletion
const canDelete = await verifyNodeOwnership('Character', id)
if (!canDelete) {
  throw new Error('Unauthorized')
}
await executeUserWrite(
  'MATCH (c:Character {id: $id, user_id: $userId}) DETACH DELETE c',
  { id }
)
```

## File Structure for Neo4j API Routes

```
app/api/
├── characters/
│   ├── route.ts           # GET (list), POST (create)
│   └── [id]/
│       └── route.ts       # GET (single), PATCH (update), DELETE
├── locations/
│   ├── route.ts
│   └── [id]/route.ts
├── moments/
│   ├── route.ts
│   ├── [id]/route.ts
│   └── timeline/
│       └── route.ts       # GET timeline
├── relationships/
│   └── route.ts           # POST (create relationship)
└── neo4j/
    └── test/
        └── route.ts       # Testing endpoint
```

## Summary

Always remember:
1. **Authentication first** - verify session before any operation
2. **User isolation always** - every query must filter by `user_id`
3. **Use helper functions** - `executeUserQuery` and `executeUserWrite`
4. **Verify ownership** - before updates and deletes
5. **Error handling** - catch and return appropriate HTTP status codes
6. **Performance** - paginate, limit traversals, exclude large fields in lists
7. **Security** - never expose Neo4j details to clients

For more details, see:
- [Database Specification](./database_spec.md) - complete Neo4j schema
- [Authentication System](../System/authentication_system.md) - auth integration details
