# Database Schema

**Related docs:**
- [Project Architecture](./project_architecture.md)
- [Authentication System](./authentication_system.md)

## Overview

The application uses **PostgreSQL** as the primary database with **Prisma** as the ORM. Currently, only the authentication-related models are implemented. The lore tracking entities (books, chapters, characters, locations, etc.) are planned but not yet implemented.

## Database Configuration

**Connection**: Configured via `DATABASE_URL` environment variable
**ORM**: Prisma 6.16.3
**Provider**: PostgreSQL

## Current Schema

### User Model

The core user model for authentication and authorization.

```prisma
model User {
  id            String    @id @default(cuid())
  name          String?
  email         String    @unique
  emailVerified DateTime?
  password      String
  image         String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  accounts      Account[]
  sessions      Session[]
}
```

**Fields:**
- `id`: Unique identifier using CUID (Collision-resistant Unique ID)
- `name`: Optional user display name
- `email`: Unique email address (used for authentication)
- `emailVerified`: Timestamp of email verification (optional, for future email verification flow)
- `password`: Bcrypt-hashed password (minimum 8 characters, hashed with salt rounds = 10)
- `image`: Optional user profile image URL
- `createdAt`: Account creation timestamp (auto-generated)
- `updatedAt`: Last update timestamp (auto-managed by Prisma)
- `accounts`: OAuth accounts (for future OAuth providers)
- `sessions`: Active sessions

**Indexes:**
- Unique index on `email` for fast lookup during authentication

### Account Model

Supports OAuth providers (prepared for future use, not currently active).

```prisma
model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String?
  access_token      String?
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String?
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}
```

**Fields:**
- `id`: Unique identifier
- `userId`: Foreign key to User
- `type`: Account type (e.g., "oauth")
- `provider`: OAuth provider name (e.g., "google", "github")
- `providerAccountId`: User ID from OAuth provider
- `refresh_token`: OAuth refresh token (optional)
- `access_token`: OAuth access token (optional)
- `expires_at`: Token expiration timestamp (optional)
- `token_type`: Token type (e.g., "Bearer")
- `scope`: OAuth scopes granted
- `id_token`: OpenID Connect ID token (optional)
- `session_state`: OAuth session state (optional)

**Relations:**
- Belongs to `User` with cascading delete

**Indexes:**
- Unique composite index on `[provider, providerAccountId]`

### Session Model

Not currently used (JWT strategy is used instead), but prepared for future database sessions.

```prisma
model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

**Fields:**
- `id`: Unique identifier
- `sessionToken`: Unique session token
- `userId`: Foreign key to User
- `expires`: Session expiration timestamp

**Relations:**
- Belongs to `User` with cascading delete

**Indexes:**
- Unique index on `sessionToken`

**Note:** Currently unused because NextAuth is configured with JWT strategy. This model is kept for potential future migration to database sessions.

### VerificationToken Model

For email verification and password reset flows (prepared for future use).

```prisma
model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}
```

**Fields:**
- `identifier`: User identifier (email or user ID)
- `token`: Unique verification token
- `expires`: Token expiration timestamp

**Indexes:**
- Unique index on `token`
- Unique composite index on `[identifier, token]`

**Note:** Currently unused. Prepared for email verification and password reset features.

## Planned Schema (Not Yet Implemented)

The following models are planned for the lore tracking functionality:

### Universe Model
- User's story universe/project
- Contains all books, entities, and timeline events

### Book Model
- Represents a book in the universe
- Contains multiple chapters
- Has metadata (title, description, status, word count goals)

### Chapter Model
- Belongs to a Book
- Contains article content and moments
- Has order/sequence number

### Entity Types
- **Character**: People in the story
- **Location**: Places in the story
- **Item**: Objects of significance
- **Organization**: Groups, factions, governments

### Moment Model
- Timeline events that occur in chapters
- Links entities to specific points in the narrative
- Has date/time information for timeline ordering

### Relationship Model
- Defines relationships between entities
- Types: family, friendship, alliance, conflict, etc.

### CustomField Model
- User-defined fields for entities
- Flexible schema for tracking additional metadata

## Database Access Patterns

### Prisma Client Singleton

Location: `lib/prisma.ts`

```typescript
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

**Why Singleton?**
- Prevents multiple Prisma Client instances in development (hot reloading)
- Reduces connection overhead
- Ensures consistent connection pooling

### Common Queries

#### User Authentication
```typescript
// Find user by email
const user = await prisma.user.findUnique({
  where: { email: credentials.email }
})

// Create new user
const user = await prisma.user.create({
  data: {
    name,
    email,
    password: hashedPassword,
  },
})
```

## Migrations

### Running Migrations

```bash
# Generate migration
npx prisma migrate dev --name migration_name

# Apply migrations to production
npx prisma migrate deploy

# Reset database (development only)
npx prisma migrate reset
```

### Current Migrations

Only initial authentication schema has been migrated. No migrations exist yet for lore tracking entities.

## Security Considerations

### Password Hashing
- **Algorithm**: bcrypt via `bcryptjs`
- **Salt Rounds**: 10
- **Implementation**: `lib/auth.ts`

```typescript
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10)
  return bcrypt.hash(password, salt)
}
```

### Email Uniqueness
- Enforced at database level via unique constraint
- Checked in application layer before user creation
- Prevents duplicate account creation

### Cascading Deletes
- `Account` and `Session` models cascade delete when User is deleted
- Ensures orphaned records don't remain in database
- Future entity models should follow similar pattern

## Performance Considerations

### Connection Pooling
- Managed automatically by Prisma
- Default pool size appropriate for serverless environments
- Can be tuned via `DATABASE_URL` connection string parameters

### Indexes
- Primary keys automatically indexed
- Unique constraints create indexes (e.g., `email` on User)
- Future entity queries should consider additional indexes for:
  - Foreign keys (userId, universeId, bookId, etc.)
  - Frequently filtered fields (entity types, dates)
  - Full-text search fields

## Future Schema Considerations

### Multi-tenancy
- Each user will have their own universes
- Need to add `userId` foreign key to Universe model
- All queries must filter by user context to prevent data leakage

### Soft Deletes
- Consider adding `deletedAt` timestamp fields
- Allows "undo" functionality
- Maintains referential integrity for historical data

### Versioning
- Consider versioning for article content
- Allows tracking changes over time
- Useful for collaborative editing features

### Full-Text Search
- PostgreSQL full-text search capabilities
- Create GIN indexes on searchable text fields
- Consider separate search index table for better performance

## Notes for Implementation

1. **Start with Universe model**: This is the top-level container
2. **Add Book and Chapter models**: Core narrative structure
3. **Implement Entity models**: Character, Location, Item, Organization
4. **Add Moment model**: Links entities to narrative timeline
5. **Create Relationship model**: Entity-to-entity connections
6. **Add CustomField support**: Flexible metadata system

Each step should include:
- Prisma schema update
- Migration generation
- Type generation (`npx prisma generate`)
- API route implementation
- Frontend integration
