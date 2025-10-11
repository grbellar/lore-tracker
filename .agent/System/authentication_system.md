# Authentication System

**Related docs:**
- [Project Architecture](./project_architecture.md)
- [Database Schema](./database_schema.md)

## Overview

The application uses **NextAuth.js v4.24.11** for authentication with a **Credentials Provider** for email/password authentication and **JWT strategy** for session management.

## Architecture

### Authentication Flow

```
User Sign Up
    ↓
POST /api/auth/signup
    ↓
Validate input (email, password length)
    ↓
Check for existing user
    ↓
Hash password (bcrypt, 10 salt rounds)
    ↓
Create user in database
    ↓
Return success → Redirect to /auth/signin

User Sign In
    ↓
POST /api/auth/signin (NextAuth)
    ↓
Credentials Provider validates
    ↓
Find user by email
    ↓
Compare password with bcrypt
    ↓
Generate JWT token
    ↓
Set session cookie
    ↓
Redirect to /dashboard
```

## Components

### 1. NextAuth Configuration

**Location**: `app/api/auth/[...nextauth]/route.ts`

```typescript
const handler = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // Validation and authentication logic
      }
    })
  ],
  pages: {
    signIn: "/auth/signin",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
      }
      return session
    }
  }
})
```

**Key Configuration:**
- **Adapter**: PrismaAdapter connects NextAuth to the database
- **Provider**: Credentials Provider for email/password authentication
- **Custom Sign-In Page**: `/auth/signin`
- **Session Strategy**: JWT (stateless, no database session storage)
- **Callbacks**: Extend JWT and session with user ID

### 2. Sign Up API Route

**Location**: `app/api/auth/signup/route.ts`

**Endpoint**: `POST /api/auth/signup`

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Validation:**
- Email and password are required
- Password must be at least 8 characters
- Email must not already exist in database

**Response (Success):**
```json
{
  "user": {
    "id": "clxxx...",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

**Response (Error):**
```json
{
  "error": "User with this email already exists"
}
```

**Status Codes:**
- `201`: User created successfully
- `400`: Validation error or user already exists
- `500`: Server error

### 3. Password Utilities

**Location**: `lib/auth.ts`

```typescript
// Hash password with bcrypt
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10)
  return bcrypt.hash(password, salt)
}

// Verify password
export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}
```

**Security:**
- Bcrypt with 10 salt rounds
- Automatic salt generation
- Secure password comparison

### 4. Route Protection Middleware

**Location**: `middleware.ts`

```typescript
export { default } from "next-auth/middleware"

export const config = {
  matcher: [
    "/((?!api/auth|auth/signin|auth/signup|_next/static|_next/image|favicon.ico).*)",
  ],
}
```

**Protected Routes:**
- All routes except:
  - `/api/auth/*` (authentication endpoints)
  - `/auth/signin` (sign-in page)
  - `/auth/signup` (sign-up page)
  - Static assets and images

**Behavior:**
- Unauthenticated users are redirected to `/auth/signin`
- Session is checked on every request
- JWT token verified automatically

### 5. Session Provider

**Location**: `app/components/SessionProvider.tsx`

```typescript
'use client'

import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react'

export default function SessionProvider({ children }: { children: React.ReactNode }) {
  return <NextAuthSessionProvider>{children}</NextAuthSessionProvider>
}
```

**Usage**: Wraps entire application in `app/layout.tsx`

**Purpose:**
- Provides session context to all client components
- Enables `useSession()` hook throughout the app
- Required for NextAuth in App Router

### 6. TypeScript Type Extensions

**Location**: `types/next-auth.d.ts`

```typescript
declare module "next-auth" {
  interface User {
    id: string
  }

  interface Session {
    user: User
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
  }
}
```

**Purpose:**
- Extends NextAuth types to include user `id`
- Ensures type safety when accessing `session.user.id`
- Required for TypeScript strict mode

## Client-Side Components

### Sign In Page

**Location**: `app/auth/signin/page.tsx`

**Features:**
- Email/password form
- Client-side validation
- Error handling and display
- Loading state during authentication
- Link to sign-up page

**Authentication:**
```typescript
const result = await signIn("credentials", {
  email,
  password,
  redirect: false,
})

if (result?.error) {
  setError("Invalid email or password")
} else {
  router.push("/dashboard")
  router.refresh()
}
```

### Sign Up Page

**Location**: `app/auth/signup/page.tsx`

**Features:**
- Name, email, password, confirm password fields
- Client-side validation:
  - Passwords match
  - Password minimum 8 characters
- Error handling and display
- Loading state during registration
- Link to sign-in page

**Registration:**
```typescript
const response = await fetch("/api/auth/signup", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ name, email, password }),
})

if (!response.ok) {
  const data = await response.json()
  setError(data.error || "Something went wrong")
} else {
  router.push("/auth/signin?registered=true")
}
```

## Session Management

### JWT Strategy

**Why JWT over Database Sessions?**
- **Scalability**: No database lookup required for session verification
- **Performance**: Faster authentication checks
- **Stateless**: Works well with serverless functions
- **Simplicity**: No session cleanup required

**JWT Contents:**
- User ID
- Email
- Name
- Expiration timestamp

**Storage:**
- Stored in HTTP-only cookie
- Cookie name: `next-auth.session-token` (development) or `__Secure-next-auth.session-token` (production)
- Automatic renewal on activity

### Accessing Session

#### Server Components
```typescript
import { getServerSession } from "next-auth/next"

export default async function Page() {
  const session = await getServerSession()
  return <div>Welcome {session?.user?.name}</div>
}
```

#### Client Components
```typescript
'use client'
import { useSession } from "next-auth/react"

export default function Component() {
  const { data: session, status } = useSession()

  if (status === "loading") return <div>Loading...</div>
  if (status === "unauthenticated") return <div>Not signed in</div>

  return <div>Welcome {session?.user?.name}</div>
}
```

#### API Routes
```typescript
import { getServerSession } from "next-auth/next"

export async function GET(req: Request) {
  const session = await getServerSession()

  if (!session) {
    return new Response("Unauthorized", { status: 401 })
  }

  // Access session.user.id
}
```

## Security Considerations

### Password Security
- **Minimum Length**: 8 characters (enforced client and server-side)
- **Hashing**: bcrypt with 10 salt rounds
- **No Plain Text**: Passwords never stored in plain text
- **Comparison**: Secure timing-safe comparison via bcrypt

### Session Security
- **HTTP-Only Cookies**: Prevents XSS attacks
- **Secure Flag**: Enabled in production (HTTPS only)
- **SameSite**: Prevents CSRF attacks
- **Token Expiration**: Automatic expiration and renewal

### Input Validation
- **Email Format**: Validated on client and server
- **Password Length**: Checked before hashing
- **Duplicate Email**: Checked before user creation
- **SQL Injection**: Protected by Prisma parameterized queries

### Route Protection
- **Middleware**: Automatic redirect for unauthenticated users
- **API Routes**: Manual session check required
- **Client Components**: useSession hook for conditional rendering

## Environment Variables

Required in `.env`:

```bash
# PostgreSQL Database connection
DATABASE_URL="postgresql://user:password@host:port/database"

# Neo4j Database connection
NEO4J_URI="bolt://localhost:7687"
NEO4J_USER="neo4j"
NEO4J_PASSWORD="secret"

# NextAuth configuration
NEXTAUTH_SECRET="your-secret-key-here"  # Generate with: openssl rand -base64 32
NEXTAUTH_URL="http://localhost:3000"    # Production: https://yourdomain.com
```

**Security:**
- `NEXTAUTH_SECRET`: Used to encrypt JWT tokens (must be kept secret)
- Never commit `.env` to version control
- Use different secrets for development and production

## Neo4j Integration

### Overview

The application uses a dual-database architecture:
- **PostgreSQL**: User accounts, authentication, subscriptions (via Prisma)
- **Neo4j**: Story data with graph relationships (characters, locations, events, etc.)

User data is isolated in Neo4j using the `user_id` property on all nodes and relationships.

### Neo4j Connection

**Location**: `lib/neo4j.ts`

The Neo4j driver is implemented as a singleton with connection pooling:

```typescript
import { driver, getSession, verifyConnection } from '@/lib/neo4j'

// Get a session for queries
const session = getSession()

// Verify connection is working
const isConnected = await verifyConnection()
```

**Configuration:**
- Connection pooling (max 50 connections)
- 30-second connection acquisition timeout
- Automatic retry logic for transient failures

### User Isolation Utilities

**Location**: `lib/neo4j-auth.ts`

Helper functions for authenticated Neo4j queries with automatic user isolation:

#### Extract User ID from Session
```typescript
import { getUserIdFromSession } from '@/lib/neo4j-auth'

const session = await getServerSession()
const userId = getUserIdFromSession(session) // throws if invalid
```

#### Execute Read Query with User Isolation
```typescript
import { executeUserQuery } from '@/lib/neo4j-auth'

// Automatically injects userId into the query
const characters = await executeUserQuery(
  'MATCH (c:Character {user_id: $userId}) RETURN c',
  {} // additional params
)
```

#### Execute Write Transaction with User Isolation
```typescript
import { executeUserWrite } from '@/lib/neo4j-auth'

const newCharacter = await executeUserWrite(
  `CREATE (c:Character {
    id: $id,
    user_id: $userId,
    name: $name,
    created_at: datetime(),
    updated_at: datetime()
  }) RETURN c`,
  {
    id: crypto.randomUUID(),
    name: 'Luke Skywalker'
  }
)
```

#### Verify Node Ownership
```typescript
import { verifyNodeOwnership } from '@/lib/neo4j-auth'

const canEdit = await verifyNodeOwnership('Character', characterId)
if (!canEdit) {
  throw new Error('Unauthorized')
}
```

#### Delete All User Data
```typescript
import { deleteAllUserData } from '@/lib/neo4j-auth'

// Use when deleting a user account
const deletedCount = await deleteAllUserData(userId)
```

### API Route Pattern for Neo4j

All Neo4j operations must be performed through authenticated API routes:

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
    // 2. Query with automatic user isolation
    const results = await executeUserQuery(
      'MATCH (c:Character {user_id: $userId}) RETURN c',
      {},
      session
    )

    return NextResponse.json({ data: results })
  } catch (error) {
    return NextResponse.json(
      { error: 'Query failed' },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  const session = await getServerSession()
  if (!session) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  const body = await req.json()

  try {
    const result = await executeUserWrite(
      `CREATE (c:Character {
        id: $id,
        user_id: $userId,
        name: $name,
        created_at: datetime(),
        updated_at: datetime()
      }) RETURN c`,
      {
        id: crypto.randomUUID(),
        name: body.name,
      },
      session
    )

    return NextResponse.json(
      { data: result[0] },
      { status: 201 }
    )
  } catch (error) {
    return NextResponse.json(
      { error: 'Creation failed' },
      { status: 500 }
    )
  }
}
```

### Testing Neo4j Integration

**Test Endpoint**: `GET /api/neo4j/test`

This endpoint verifies:
- Neo4j connection is working
- User authentication is functioning
- User isolation is enforced
- Create/read operations work correctly

**Example Response:**
```json
{
  "success": true,
  "message": "Neo4j integration test passed",
  "data": {
    "user": {
      "id": "clxxx...",
      "email": "user@example.com",
      "name": "John Doe"
    },
    "neo4j_connection": "success",
    "test_node_created": {
      "id": "uuid...",
      "name": "Test Node for user@example.com"
    },
    "user_nodes_count": 1,
    "test_completed_at": "2025-10-11T..."
  }
}
```

### Neo4j Security Best Practices

1. **Always Include user_id**: Every Neo4j query MUST filter by `user_id`
2. **Use Helper Functions**: Always use `executeUserQuery` and `executeUserWrite`
3. **Verify Ownership**: Check ownership before updates/deletes with `verifyNodeOwnership`
4. **Server-Side Only**: Never expose Neo4j operations to client components
5. **Session Validation**: Always verify session before Neo4j operations
6. **Error Handling**: Catch and handle Neo4j-specific errors appropriately

### Data Isolation Architecture

Per the [Database Specification](./../SOP/database_spec.md):

- Every Neo4j node has a `user_id` property
- Every relationship has a `user_id` property
- Node labels define types (`:Character`, `:Location`, etc.)
- Indexes on `user_id` for performance
- Unique constraints on node IDs within labels

**Example User-Isolated Node:**
```cypher
CREATE (c:Character {
  id: "uuid-123",
  user_id: "user-abc",  // REQUIRED for isolation
  name: "Luke Skywalker",
  created_at: datetime()
})
```

**Example User-Isolated Relationship:**
```cypher
MATCH (c1:Character {id: $char1Id, user_id: $userId})
MATCH (c2:Character {id: $char2Id, user_id: $userId})
CREATE (c1)-[:KNOWS {
  user_id: $userId,  // REQUIRED for isolation
  relationship_type: "friend",
  since: date("2024-01-01")
}]->(c2)
```

## Future Enhancements

### Planned Features
1. **Email Verification**: Use VerificationToken model
2. **Password Reset**: Implement forgot password flow
3. **OAuth Providers**: Add Google, GitHub authentication
4. **Two-Factor Authentication**: Add 2FA support
5. **Session Management**: Allow users to view/revoke active sessions
6. **Account Settings**: Email change, password change

### OAuth Integration

To add OAuth providers (e.g., Google):

```typescript
import GoogleProvider from "next-auth/providers/google"

providers: [
  GoogleProvider({
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  }),
  // Keep existing Credentials provider
]
```

**Note**: The Account model is already prepared for OAuth providers.

## Troubleshooting

### Common Issues

**Issue**: "Invalid NEXTAUTH_SECRET"
- **Solution**: Generate a new secret with `openssl rand -base64 32`

**Issue**: "Session not found in client components"
- **Solution**: Ensure SessionProvider wraps the component tree

**Issue**: "Redirect loop on signin"
- **Solution**: Check middleware matcher pattern and custom pages configuration

**Issue**: "Cannot read property 'id' of undefined"
- **Solution**: Add null checks for session/user or ensure TypeScript types are extended

## Testing Recommendations

### Manual Testing Checklist
- [ ] Sign up with valid credentials
- [ ] Sign up with existing email (should fail)
- [ ] Sign up with short password (should fail)
- [ ] Sign in with valid credentials
- [ ] Sign in with invalid credentials (should fail)
- [ ] Access protected route while authenticated (should succeed)
- [ ] Access protected route while unauthenticated (should redirect)
- [ ] Sign out and verify session is cleared

### Future Automated Tests
- Unit tests for password hashing/verification
- Integration tests for sign up/sign in flows
- E2E tests for authentication user journeys
