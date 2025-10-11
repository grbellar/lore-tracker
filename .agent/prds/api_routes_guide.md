# API Routes Implementation Guide

**Purpose:** Standard operating procedures for implementing RESTful API routes for Neo4j node types

**Status:** Active Template (Based on Moments API Implementation)

**Related Docs:**
- [Moments API Implementation](../tasks/moments_api_implementation.md)
- [Backend Overview](./backend_overview.md)
- [Neo4j Query Patterns](./neo4j_query_patterns.md)
- [Route Protection Patterns](./route_protection_patterns.md)

---

## Overview

This guide provides a standardized approach for implementing API routes that interact with Neo4j graph database nodes. All routes follow the same security, authentication, and user isolation patterns established in the Moments API implementation.

## Standard Route Structure

```
app/api/{resource}/
├── route.ts           # GET (list), POST (create)
└── [id]/
    └── route.ts       # GET (single), PATCH (update), DELETE
```

### Example: Moments API
```
app/api/moments/
├── route.ts           # List moments, Create moment
└── [id]/
    └── route.ts       # Get moment, Update moment, Delete moment
```

---

## Required Imports

Every API route file must import these essential modules:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth-config'  // ← CRITICAL: Must include authOptions
import { executeUserQuery, executeUserWrite, verifyNodeOwnership } from '@/lib/neo4j-auth'
import { randomUUID } from 'crypto'
```

**⚠️ CRITICAL:** Always pass `authOptions` to `getServerSession()`. Without it, the session callbacks won't run and `session.user.id` will be undefined, causing authentication failures.

```typescript
// ❌ WRONG - Will fail with "Unauthorized: No valid session or user ID"
const session = await getServerSession()

// ✅ CORRECT - Session callbacks run, user.id is populated
const session = await getServerSession(authOptions)
```

---

## Authentication Pattern

**Apply to ALL endpoints** (GET, POST, PATCH, DELETE):

```typescript
export async function GET(request: NextRequest) {
  try {
    // 1. Verify authentication with authOptions
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Your endpoint logic here...

  } catch (error) {
    console.error('GET /api/{resource} error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch {resource}' },
      { status: 500 }
    )
  }
}
```

---

## User Isolation Pattern

**All database operations MUST use user isolation functions:**

### For Read Operations
```typescript
const results = await executeUserQuery(
  'MATCH (n:NodeType {user_id: $userId}) RETURN n',
  { /* additional params */ },
  session  // ← Pass session, userId auto-injected
)
```

### For Write Operations
```typescript
const results = await executeUserWrite(
  'CREATE (n:NodeType {id: $id, user_id: $userId, ...}) RETURN n',
  { id: randomUUID(), /* other params */ },
  session  // ← Pass session, userId auto-injected
)
```

**Never query Neo4j directly without user isolation!**

---

## Standard Endpoints Implementation

### 1. GET /api/{resource} - List All (Lightweight)

**Purpose:** Return paginated list excluding large fields for performance

```typescript
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse pagination parameters
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = parseInt(searchParams.get('skip') || '0')

    // Query with lightweight fields only
    const query = `
      MATCH (n:NodeType {user_id: $userId})
      RETURN n.id as id,
             n.name as name,
             n.preview as preview,
             n.created_at as created_at
      ORDER BY n.created_at DESC
      SKIP $skip
      LIMIT $limit
    `

    const results = await executeUserQuery(query, { limit, skip }, session)

    return NextResponse.json({ data: results }, { status: 200 })
  } catch (error) {
    console.error('GET /api/{resource} error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch {resource}' },
      { status: 500 }
    )
  }
}
```

**Key Points:**
- ✅ Exclude large fields (e.g., `content`, `description`) from list queries
- ✅ Support pagination with `limit` and `skip`
- ✅ Default sort by `created_at DESC`
- ✅ Return data in `{ data: [...] }` wrapper

---

### 2. POST /api/{resource} - Create New

**Purpose:** Create new node with validation and auto-generated fields

```typescript
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse and validate request body
    let body
    try {
      body = await request.json()
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid JSON body' },
        { status: 400 }
      )
    }

    const { name, /* other fields */ } = body

    // Validate required fields
    if (!name || name.trim() === '') {
      return NextResponse.json(
        { error: 'name is required' },
        { status: 400 }
      )
    }

    // Generate unique ID
    const id = randomUUID()

    // Create node
    const query = `
      CREATE (n:NodeType {
        id: $id,
        user_id: $userId,
        name: $name,
        created_at: datetime(),
        updated_at: datetime()
      })
      RETURN n
    `

    const result = await executeUserWrite(
      query,
      { id, name: name.trim() /* other params */ },
      session
    )

    if (!result || result.length === 0) {
      return NextResponse.json(
        { error: 'Failed to create {resource}' },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: result[0] }, { status: 201 })
  } catch (error) {
    console.error('POST /api/{resource} error:', error)
    return NextResponse.json(
      { error: 'Failed to create {resource}' },
      { status: 500 }
    )
  }
}
```

**Key Points:**
- ✅ Validate required fields before database operation
- ✅ Generate UUID for new node
- ✅ Always include `user_id`, `created_at`, `updated_at`
- ✅ Return 201 status on success
- ✅ Return created node data in response

---

### 3. GET /api/{resource}/[id] - Get Single

**Purpose:** Retrieve single node with optional full/lightweight mode

```typescript
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params
    const { searchParams } = new URL(request.url)
    const fields = searchParams.get('fields') || 'full'

    let query: string

    if (fields === 'lightweight') {
      // Lightweight: exclude large fields
      query = `
        MATCH (n:NodeType {id: $id, user_id: $userId})
        RETURN n.id as id,
               n.name as name,
               n.preview as preview,
               n.created_at as created_at
      `
    } else {
      // Full: include everything + relationships
      query = `
        MATCH (n:NodeType {id: $id, user_id: $userId})
        OPTIONAL MATCH (n)-[:RELATED_TO]->(r:RelatedNode {user_id: $userId})
        RETURN n,
               collect(DISTINCT {id: r.id, name: r.name}) as related
      `
    }

    const result = await executeUserQuery(query, { id }, session)

    if (!result || result.length === 0) {
      return NextResponse.json(
        { error: '{Resource} not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ data: result[0] }, { status: 200 })
  } catch (error) {
    console.error('GET /api/{resource}/[id] error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch {resource}' },
      { status: 500 }
    )
  }
}
```

**Key Points:**
- ✅ Support `fields` query parameter for lightweight mode
- ✅ Use OPTIONAL MATCH for relationships
- ✅ Filter relationships by `user_id` as well
- ✅ Return 404 if not found or unauthorized

---

### 4. PATCH /api/{resource}/[id] - Update

**Purpose:** Update existing node with ownership verification

```typescript
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params

    // Parse request body
    let body
    try {
      body = await request.json()
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid JSON body' },
        { status: 400 }
      )
    }

    // Verify ownership BEFORE update
    const isOwner = await verifyNodeOwnership('NodeType', id, session)
    if (!isOwner) {
      return NextResponse.json(
        { error: '{Resource} not found or unauthorized' },
        { status: 404 }
      )
    }

    // Extract updatable fields
    const { name /* other fields */ } = body

    // Build dynamic SET clause
    const updates: string[] = []
    const queryParams: Record<string, any> = { id }

    if (name !== undefined) {
      updates.push('n.name = $name')
      queryParams.name = name
    }
    // ... add other fields

    // Always update updated_at
    updates.push('n.updated_at = datetime()')

    if (updates.length === 1) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      )
    }

    // Execute update
    const query = `
      MATCH (n:NodeType {id: $id, user_id: $userId})
      SET ${updates.join(', ')}
      RETURN n
    `

    const result = await executeUserWrite(query, queryParams, session)

    if (!result || result.length === 0) {
      return NextResponse.json(
        { error: 'Failed to update {resource}' },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: result[0] }, { status: 200 })
  } catch (error) {
    console.error('PATCH /api/{resource}/[id] error:', error)
    return NextResponse.json(
      { error: 'Failed to update {resource}' },
      { status: 500 }
    )
  }
}
```

**Key Points:**
- ✅ Verify ownership with `verifyNodeOwnership()` BEFORE update
- ✅ Build dynamic SET clause based on provided fields
- ✅ Always update `updated_at` timestamp
- ✅ Return 404 if not owner (don't reveal existence)

---

### 5. DELETE /api/{resource}/[id] - Delete

**Purpose:** Delete node and relationships with ownership verification

```typescript
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params

    // Verify ownership BEFORE deletion
    const isOwner = await verifyNodeOwnership('NodeType', id, session)
    if (!isOwner) {
      return NextResponse.json(
        { error: '{Resource} not found or unauthorized' },
        { status: 404 }
      )
    }

    // Delete node and all relationships
    const query = `
      MATCH (n:NodeType {id: $id, user_id: $userId})
      DETACH DELETE n
    `

    await executeUserWrite(query, { id }, session)

    return NextResponse.json(
      { success: true, message: '{Resource} deleted' },
      { status: 200 }
    )
  } catch (error) {
    console.error('DELETE /api/{resource}/[id] error:', error)
    return NextResponse.json(
      { error: 'Failed to delete {resource}' },
      { status: 500 }
    )
  }
}
```

**Key Points:**
- ✅ Verify ownership with `verifyNodeOwnership()` BEFORE deletion
- ✅ Use `DETACH DELETE` to remove all relationships
- ✅ Return success message in response
- ✅ Return 404 if not owner (don't reveal existence)

---

## Helper Functions

### Auto-Preview Generation

For nodes with large content fields:

```typescript
function generatePreview(content: string, length: number = 300): string {
  return content.substring(0, length)
}

// Use in POST/PATCH
const finalPreview = preview || (content ? generatePreview(content) : '')
```

---

## Frontend Integration Pattern

### 1. Create Custom Hook

```typescript
// app/hooks/use{Resource}.ts
import { useState, useCallback } from 'react'

interface ResourceData {
  id?: string
  name: string
  // ... other fields
}

export function useResource() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const saveResource = useCallback(async (data: ResourceData) => {
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const response = await fetch('/api/{resource}', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save')
      }

      const result = await response.json()
      setSuccess(true)
      return result.data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const updateResource = useCallback(async (id: string, data: Partial<ResourceData>) => {
    // Similar implementation for PATCH
  }, [])

  const deleteResource = useCallback(async (id: string) => {
    // Similar implementation for DELETE
  }, [])

  return {
    loading,
    error,
    success,
    saveResource,
    updateResource,
    deleteResource,
  }
}
```

### 2. Use Hook in Components

```typescript
// In your page/component
import { useResource } from '@/app/hooks/useResource'

export default function Page() {
  const { loading, error, success, saveResource } = useResource()
  const [name, setName] = useState('')

  const handleSave = async () => {
    try {
      await saveResource({ name })
      // Show success toast
    } catch (err) {
      // Show error toast
    }
  }

  return (
    <div>
      <input value={name} onChange={(e) => setName(e.target.value)} />
      <button onClick={handleSave} disabled={loading || !name}>
        {loading ? 'Saving...' : 'Save'}
      </button>
      {success && <Toast message="Saved successfully!" type="success" />}
      {error && <Toast message={error} type="error" />}
    </div>
  )
}
```

---

## Error Handling Standards

### Standard Error Responses

```typescript
// 400 - Bad Request (validation errors)
return NextResponse.json(
  { error: 'Field {field} is required' },
  { status: 400 }
)

// 401 - Unauthorized (no session)
return NextResponse.json(
  { error: 'Unauthorized' },
  { status: 401 }
)

// 404 - Not Found (or not owned by user)
return NextResponse.json(
  { error: '{Resource} not found' },
  { status: 404 }
)

// 500 - Server Error (database failures)
return NextResponse.json(
  { error: 'Failed to {action} {resource}' },
  { status: 500 }
)
```

### Error Logging

Always log errors with context:

```typescript
catch (error) {
  console.error('POST /api/{resource} error:', error)
  return NextResponse.json(
    { error: 'Failed to create {resource}' },
    { status: 500 }
  )
}
```

---

## Performance Optimizations

### 1. Lightweight List Queries
Always exclude large fields from list endpoints:
```cypher
// ❌ BAD - Returns full content
MATCH (n:Node {user_id: $userId}) RETURN n

// ✅ GOOD - Returns only necessary fields
MATCH (n:Node {user_id: $userId})
RETURN n.id, n.name, n.preview, n.created_at
```

### 2. Optional Full Content
Use `fields` parameter for single item endpoints:
```typescript
const fields = searchParams.get('fields') || 'full'
if (fields === 'lightweight') {
  // Exclude large fields
}
```

### 3. Pagination
Always support pagination with sensible defaults:
```typescript
const limit = parseInt(searchParams.get('limit') || '20')
const skip = parseInt(searchParams.get('skip') || '0')
```

### 4. Relationship Traversal
Use OPTIONAL MATCH for relationships to avoid null results:
```cypher
MATCH (n:Node {id: $id, user_id: $userId})
OPTIONAL MATCH (n)-[:REL]->(r:Related {user_id: $userId})
RETURN n, collect(r) as related
```

---

## Security Checklist

Before deploying any API route, verify:

- [ ] ✅ `authOptions` passed to `getServerSession()`
- [ ] ✅ Session verification at start of every endpoint
- [ ] ✅ User isolation via `executeUserQuery`/`executeUserWrite`
- [ ] ✅ Ownership verification before update/delete
- [ ] ✅ All Cypher queries filter by `user_id`
- [ ] ✅ Input validation for required fields
- [ ] ✅ Proper HTTP status codes for errors
- [ ] ✅ No sensitive data in error messages
- [ ] ✅ DETACH DELETE for proper cleanup
- [ ] ✅ Error logging for debugging

---

## Testing Checklist

For each API route, manually verify:

- [ ] ✅ Authentication required (401 without session)
- [ ] ✅ User isolation (can't access other users' data)
- [ ] ✅ Ownership verification (can't update/delete others' nodes)
- [ ] ✅ Validation (400 for missing required fields)
- [ ] ✅ Pagination works correctly
- [ ] ✅ Lightweight vs full mode works
- [ ] ✅ Error handling returns proper status codes
- [ ] ✅ Created data visible in Neo4j with correct user_id

---

## Quick Reference: Apply This Template

1. **Copy route structure** from `app/api/moments/`
2. **Replace all instances:**
   - `Moment` → `YourNodeType`
   - `moments` → `yourresource`
   - `moment` → `yourresource` (singular)
3. **Update schema fields** for your node type
4. **Update validation** for required fields
5. **Test authentication** and user isolation
6. **Create frontend hook** following pattern
7. **Update documentation** with implementation details

---

## Common Pitfalls to Avoid

### ❌ Missing authOptions
```typescript
// WRONG - Will cause auth failures
const session = await getServerSession()
```

### ❌ No User Isolation
```typescript
// WRONG - Allows cross-user data access
const result = await session.run('MATCH (n:Node {id: $id}) RETURN n', { id })
```

### ❌ No Ownership Verification
```typescript
// WRONG - Allows users to update others' data
await executeUserWrite('MATCH (n:Node {id: $id}) SET n.name = $name', { id, name })
```

### ❌ Revealing Existence
```typescript
// WRONG - Reveals node exists even if user doesn't own it
if (!isOwner) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
}
```

### ✅ Correct Pattern
```typescript
// RIGHT - Returns 404 for both non-existent and unauthorized
if (!isOwner) {
  return NextResponse.json({ error: 'Not found' }, { status: 404 })
}
```

---

## Examples in Codebase

Reference implementations:
- **Moments API**: `app/api/moments/` - Complete working example
- **Neo4j Auth**: `lib/neo4j-auth.ts` - User isolation utilities
- **Auth Config**: `lib/auth-config.ts` - NextAuth configuration
- **Frontend Hook**: `app/hooks/useMoment.ts` - API integration pattern

---

**Last Updated:** 2025-10-11
**Based On:** Moments API Implementation (v1.0)
