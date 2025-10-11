# Story Lore Database Design Specification

## Overview
Two-database system for a story lore app:
- **PostgreSQL**: User accounts, auth, subscriptions
- **Neo4j**: Story data (characters, locations, events, etc.)

Each user has their own isolated story world. No data sharing between users.

## Key Design Decisions
- Every Neo4j node/relationship has a `user_id` property for data isolation
- Neo4j labels define node types (`:Character`, `:Location`, etc.)
- No separate "type" property needed - labels are faster and more efficient

---

## PostgreSQL Schema

### users
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | User identifier |
| email | VARCHAR(255) | UNIQUE, NOT NULL | Email address |
| username | VARCHAR(100) | UNIQUE, NOT NULL | Display name |
| password_hash | VARCHAR(255) | NOT NULL | Bcrypt hash |
| created_at | TIMESTAMP | NOT NULL | Account creation |
| updated_at | TIMESTAMP | NOT NULL | Last update |

### user_preferences
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| user_id | UUID | PRIMARY KEY, FK→users | User reference |
| theme | VARCHAR(50) | DEFAULT 'light' | UI theme |
| default_world_settings | JSONB | DEFAULT '{}' | World defaults |
| notification_preferences | JSONB | DEFAULT '{}' | Notification settings |
| updated_at | TIMESTAMP | NOT NULL | Last update |

### subscriptions
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Subscription ID |
| user_id | UUID | NOT NULL, FK→users | User reference |
| tier | VARCHAR(50) | NOT NULL | free/basic/premium |
| status | VARCHAR(50) | NOT NULL | active/cancelled/expired |
| stripe_customer_id | VARCHAR(255) | UNIQUE | Stripe customer |
| stripe_subscription_id | VARCHAR(255) | UNIQUE | Stripe subscription |
| current_period_start | TIMESTAMP | NOT NULL | Billing start |
| current_period_end | TIMESTAMP | NOT NULL | Billing end |
| created_at | TIMESTAMP | NOT NULL | Creation date |

### PostgreSQL Indexes
```sql
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
```

---

## Neo4j Schema

### Node Labels & Properties

#### :Character
| Property | Type | Required | Description |
|----------|------|----------|-------------|
| id | String (UUID) | Yes | Unique identifier |
| user_id | String (UUID) | Yes | User who owns this |
| name | String | Yes | Character name |
| description | String | No | Character details |
| attributes | Map | No | Flexible props (age, race, etc.) |
| created_at | DateTime | Yes | Creation timestamp |
| updated_at | DateTime | Yes | Last modified |

#### :Location
| Property | Type | Required | Description |
|----------|------|----------|-------------|
| id | String (UUID) | Yes | Unique identifier |
| user_id | String (UUID) | Yes | User who owns this |
| name | String | Yes | Location name |
| description | String | No | Location details |
| attributes | Map | No | Flexible props (population, climate, etc.) |
| created_at | DateTime | Yes | Creation timestamp |
| updated_at | DateTime | Yes | Last modified |

#### :Moment
| Property | Type | Required | Description |
|----------|------|----------|-------------|
| id | String (UUID) | Yes | Unique identifier |
| user_id | String (UUID) | Yes | User who owns this |
| title | String | Yes | Event title |
| content | String | No | Full text from the moment |
| summary | String | No | Moment summary |
| preview | String | No | Moment preview. First 300 characters of text for moment timeline |
| timestamp | DateTime | No | In-world time |
| created_at | DateTime | Yes | Creation timestamp |
| updated_at | DateTime | Yes | Last modified |

#### :Item
| Property | Type | Required | Description |
|----------|------|----------|-------------|
| id | String (UUID) | Yes | Unique identifier |
| user_id | String (UUID) | Yes | User who owns this |
| name | String | Yes | Item name |
| description | String | No | Item details |
| attributes | Map | No | Flexible props (power, rarity, etc.) |
| created_at | DateTime | Yes | Creation timestamp |
| updated_at | DateTime | Yes | Last modified |

#### :Organization
| Property | Type | Required | Description |
|----------|------|----------|-------------|
| id | String (UUID) | Yes | Unique identifier |
| user_id | String (UUID) | Yes | User who owns this |
| name | String | Yes | Organization name |
| description | String | No | Organization details |
| attributes | Map | No | Flexible props (alignment, etc.) |
| created_at | DateTime | Yes | Creation timestamp |
| updated_at | DateTime | Yes | Last modified |

### Multi-Label Patterns (Optional)
```cypher
// Nodes can have multiple labels for subtypes
(:Character:Hero {name: "Luke"})
(:Character:Villain {name: "Vader"})
(:Location:City:Capital {name: "Kings Landing"})
(:Moment:Battle {title: "Final Showdown"})
```

### Relationships

#### BEFORE / AFTER
Links moments in chronological order (doubly-linked list).
- Properties: `user_id`
- Usage: `(:Moment)-[:AFTER]->(:Moment)`

#### KNOWS
Character relationships (friends, enemies, family).
- Properties: `user_id`, `relationship_type`, `since`, `strength`, `context`
- Usage: `(:Character)-[:KNOWS]->(:Character)`

#### PARTICIPATED_IN
Characters involved in events.
- Properties: `user_id`, `role`, `importance`
- Usage: `(:Character)-[:PARTICIPATED_IN]->(:Moment)`

#### LOCATED_AT
Where characters/items are.
- Properties: `user_id`, `from`, `to`, `reason`
- Usage: `(:Character)-[:LOCATED_AT]->(:Location)`

#### OWNS
Item ownership.
- Properties: `user_id`, `since`, `how_acquired`
- Usage: `(:Character)-[:OWNS]->(:Item)`

#### MEMBER_OF
Organization membership.
- Properties: `user_id`, `role`, `since`, `rank`
- Usage: `(:Character)-[:MEMBER_OF]->(:Organization)`

#### OCCURRED_AT
Where events happened.
- Properties: `user_id`
- Usage: `(:Moment)-[:OCCURRED_AT]->(:Location)`

### Neo4j Indexes
```cypher
// User isolation index (critical for performance)
CREATE INDEX user_isolation IF NOT EXISTS FOR (n) ON (n.user_id);

// Label-specific indexes
CREATE INDEX character_user IF NOT EXISTS FOR (c:Character) ON (c.user_id);
CREATE INDEX location_user IF NOT EXISTS FOR (l:Location) ON (l.user_id);
CREATE INDEX item_user IF NOT EXISTS FOR (i:Item) ON (i.user_id);
CREATE INDEX organization_user IF NOT EXISTS FOR (o:Organization) ON (o.user_id);

// Unique constraints per label
CREATE CONSTRAINT character_id_unique IF NOT EXISTS FOR (c:Character) REQUIRE c.id IS UNIQUE;
CREATE CONSTRAINT location_id_unique IF NOT EXISTS FOR (l:Location) REQUIRE l.id IS UNIQUE;
CREATE CONSTRAINT moment_id_unique IF NOT EXISTS FOR (m:Moment) REQUIRE m.id IS UNIQUE;
CREATE CONSTRAINT item_id_unique IF NOT EXISTS FOR (i:Item) REQUIRE i.id IS UNIQUE;
CREATE CONSTRAINT organization_id_unique IF NOT EXISTS FOR (o:Organization) REQUIRE o.id IS UNIQUE;

// Relationship index
CREATE INDEX rel_user_id IF NOT EXISTS FOR ()-[r]-() ON (r.user_id);
```

---

## API Implementation

### Core Principles
1. Extract `user_id` from JWT on every request
2. Always filter by `user_id` in queries
3. Never expose internal IDs
4. Check ownership before updates/deletes

### Example Queries

#### Create Character
```cypher
CREATE (c:Character {
  id: randomUUID(),
  user_id: $userId,
  name: $name,
  description: $description,
  created_at: datetime(),
  updated_at: datetime()
}) 
RETURN c
```

#### Get User's Characters
```cypher
MATCH (c:Character {user_id: $userId})
RETURN c
ORDER BY c.name
```

#### Update Character (with ownership check)
```cypher
MATCH (c:Character {id: $characterId, user_id: $userId})
SET c.name = $name, c.updated_at = datetime()
RETURN c
```

#### Delete User's Data
```cypher
MATCH (n {user_id: $userId})
DETACH DELETE n
```

#### Get Character's Full Story
```cypher
MATCH (c:Character {id: $characterId, user_id: $userId})
OPTIONAL MATCH (c)-[:PARTICIPATED_IN]->(m:Moment)
OPTIONAL MATCH (c)-[:LOCATED_AT]->(l:Location)
OPTIONAL MATCH (c)-[:OWNS]->(i:Item)
OPTIONAL MATCH (c)-[:KNOWS]->(other:Character)
RETURN c, 
  collect(DISTINCT m) as moments,
  collect(DISTINCT l) as locations,
  collect(DISTINCT i) as items,
  collect(DISTINCT other) as relationships
```

#### Get Timeline (Lightweight - Preview Only)
```cypher
// Returns only preview data for timeline display (excludes large content field)
MATCH (start:Moment {user_id: $userId})
WHERE NOT (:Moment)-[:AFTER]->(start)
MATCH path = (start)-[:AFTER*0..]->(m:Moment)
RETURN m.id as id,
       m.title as title,
       m.preview as preview,
       m.summary as summary,
       m.timestamp as timestamp,
       m.created_at as created_at,
       m.updated_at as updated_at
ORDER BY length(path)
```

#### Get Single Moment (Full Content)
```cypher
// Fetch full moment details including content when user clicks into a moment
MATCH (m:Moment {id: $momentId, user_id: $userId})
RETURN m
```

#### Get Moments List (Card View)
```cypher
// Get all moments in card/list view without full content
MATCH (m:Moment {user_id: $userId})
RETURN m.id as id,
       m.title as title,
       m.preview as preview,
       m.summary as summary,
       m.timestamp as timestamp,
       m.created_at as created_at
ORDER BY m.created_at DESC
LIMIT $limit
SKIP $offset
```

#### Get Moments with Related Entities (Lightweight)
```cypher
// Get moments with related characters/locations but exclude content
MATCH (m:Moment {user_id: $userId})
OPTIONAL MATCH (m)<-[:PARTICIPATED_IN]-(c:Character)
OPTIONAL MATCH (m)-[:OCCURRED_AT]->(l:Location)
RETURN m.id as id,
       m.title as title,
       m.preview as preview,
       m.timestamp as timestamp,
       collect(DISTINCT {id: c.id, name: c.name}) as characters,
       collect(DISTINCT {id: l.id, name: l.name}) as locations
ORDER BY m.timestamp DESC
```

#### Reorder Moments
```cypher
// Remove from current position
MATCH (prev:Moment)-[:AFTER]->(target:Moment {id: $momentId, user_id: $userId})-[:AFTER]->(next:Moment)
CREATE (prev)-[:AFTER {user_id: $userId}]->(next)
CREATE (next)-[:BEFORE {user_id: $userId}]->(prev)
DELETE r1, r2, r3, r4

// Insert at new position
MATCH (before:Moment {id: $beforeId, user_id: $userId})-[r:AFTER]->(after:Moment)
DELETE r
CREATE (before)-[:AFTER {user_id: $userId}]->(target)
CREATE (target)-[:AFTER {user_id: $userId}]->(after)
// Also update BEFORE relationships
```

---

## JavaScript Implementation Examples

### Create Operations
```javascript
async function createCharacter(userId, data) {
  const result = await neo4j.run(
    `CREATE (c:Character {
      id: $id,
      user_id: $userId,
      name: $name,
      description: $description,
      created_at: datetime(),
      updated_at: datetime()
    }) RETURN c`,
    { 
      id: crypto.randomUUID(),
      userId,
      name: data.name,
      description: data.description 
    }
  );
  return result.records[0].get('c').properties;
}
```

### Read Operations
```javascript
async function getUserCharacters(userId) {
  const result = await neo4j.run(
    'MATCH (c:Character {user_id: $userId}) RETURN c ORDER BY c.name',
    { userId }
  );
  return result.records.map(r => r.get('c').properties);
}

// Lightweight timeline - excludes content field for performance
async function getTimelinePreview(userId) {
  const result = await neo4j.run(
    `MATCH (start:Moment {user_id: $userId})
     WHERE NOT (:Moment)-[:AFTER]->(start)
     MATCH path = (start)-[:AFTER*0..]->(m:Moment)
     RETURN m.id as id,
            m.title as title,
            m.preview as preview,
            m.summary as summary,
            m.timestamp as timestamp,
            m.created_at as created_at,
            m.updated_at as updated_at
     ORDER BY length(path)`,
    { userId }
  );

  return result.records.map(r => ({
    id: r.get('id'),
    title: r.get('title'),
    preview: r.get('preview'),
    summary: r.get('summary'),
    timestamp: r.get('timestamp'),
    created_at: r.get('created_at'),
    updated_at: r.get('updated_at')
  }));
}

// Full moment with content - only when user views details
async function getMomentDetails(userId, momentId) {
  const result = await neo4j.run(
    `MATCH (m:Moment {id: $momentId, user_id: $userId})
     RETURN m`,
    { userId, momentId }
  );

  if (!result.records.length) {
    throw new Error('Moment not found or unauthorized');
  }

  return result.records[0].get('m').properties;
}

// Paginated moments list for browsing
async function getMomentsList(userId, { limit = 20, offset = 0 }) {
  const result = await neo4j.run(
    `MATCH (m:Moment {user_id: $userId})
     RETURN m.id as id,
            m.title as title,
            m.preview as preview,
            m.summary as summary,
            m.timestamp as timestamp,
            m.created_at as created_at
     ORDER BY m.created_at DESC
     SKIP $offset
     LIMIT $limit`,
    { userId, limit, offset }
  );

  return result.records.map(r => ({
    id: r.get('id'),
    title: r.get('title'),
    preview: r.get('preview'),
    summary: r.get('summary'),
    timestamp: r.get('timestamp'),
    created_at: r.get('created_at')
  }));
}

// Moments with related entities (characters/locations) - lightweight
async function getMomentsWithRelations(userId) {
  const result = await neo4j.run(
    `MATCH (m:Moment {user_id: $userId})
     OPTIONAL MATCH (m)<-[:PARTICIPATED_IN]-(c:Character)
     OPTIONAL MATCH (m)-[:OCCURRED_AT]->(l:Location)
     RETURN m.id as id,
            m.title as title,
            m.preview as preview,
            m.timestamp as timestamp,
            collect(DISTINCT {id: c.id, name: c.name}) as characters,
            collect(DISTINCT {id: l.id, name: l.name}) as locations
     ORDER BY m.timestamp DESC`,
    { userId }
  );

  return result.records.map(r => ({
    id: r.get('id'),
    title: r.get('title'),
    preview: r.get('preview'),
    timestamp: r.get('timestamp'),
    characters: r.get('characters').filter(c => c.id !== null),
    locations: r.get('locations').filter(l => l.id !== null)
  }));
}
```

### Update Operations
```javascript
async function updateCharacter(userId, characterId, updates) {
  const result = await neo4j.run(
    `MATCH (c:Character {id: $characterId, user_id: $userId})
     SET c += $updates, c.updated_at = datetime()
     RETURN c`,
    { characterId, userId, updates }
  );
  
  if (!result.records.length) {
    throw new Error('Character not found or unauthorized');
  }
  
  return result.records[0].get('c').properties;
}
```

### Delete User Account
```javascript
async function deleteUser(userId) {
  const pgClient = await pool.connect();
  const neo4jSession = driver.session();
  
  try {
    await pgClient.query('BEGIN');
    
    // Delete from Neo4j
    await neo4jSession.run(
      'MATCH (n {user_id: $userId}) DETACH DELETE n',
      { userId }
    );
    
    // Delete from PostgreSQL (cascades to related tables)
    await pgClient.query('DELETE FROM users WHERE id = $1', [userId]);
    
    await pgClient.query('COMMIT');
  } catch (error) {
    await pgClient.query('ROLLBACK');
    throw error;
  } finally {
    await neo4jSession.close();
    pgClient.release();
  }
}
```

---

## Security Rules

### Must-Follow Rules
1. **Every query includes user_id filter** - No exceptions
2. JWT required for all API calls
3. Validate ownership before any updates/deletes
4. Use parameterized queries (prevent injection)
5. Rate limit by user tier
---

## Environment Variables
```bash
# PostgreSQL
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=loretracker
POSTGRES_USER=postgres
POSTGRES_PASSWORD=secret

# Neo4j
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=secret

# Auth
JWT_SECRET=your-secret-key
JWT_EXPIRY=168h # 7 days

```

---

## Docker Compose Setup
```yaml
version: '3.8'
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: loretracker
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: secret
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
  
  neo4j:
    image: neo4j:5-community
    environment:
      NEO4J_AUTH: neo4j/secret
    volumes:
      - neo4j_data:/data
    ports:
      - "7474:7474"
      - "7687:7687"

volumes:
  postgres_data:
  neo4j_data:
```

---

## Migration Scripts

### Rebuild Moment Timeline
```cypher
MATCH (m:Moment {user_id: $userId})
WITH collect(m) as moments
FOREACH (i IN range(0, size(moments)-2) |
  FOREACH (m1 IN [moments[i]] |
    FOREACH (m2 IN [moments[i+1]] |
      MERGE (m1)-[:AFTER {user_id: $userId}]->(m2)
      MERGE (m2)-[:BEFORE {user_id: $userId}]->(m1)
    )
  )
)
```

---

## Performance Tips
1. Use labels for node types, not properties
2. Index on (label + user_id) for fast lookups
3. Batch operations with UNWIND for bulk inserts
4. Limit relationship traversal depth (max 3-4 levels)
5. Use connection pooling for both databases
6. **Exclude large text fields from list/timeline queries** - Only fetch `content` when viewing moment details
7. Use pagination (LIMIT/SKIP) for large result sets
8. Consider read replicas at scale

---

## Testing Checklist

### Unit Tests
- [ ] User CRUD operations
- [ ] Auth flow (login/logout/JWT)
- [ ] Node CRUD for each label type
- [ ] Relationship CRUD for each type
- [ ] Moment reordering logic
- [ ] Data isolation between users

### Integration Tests
- [ ] User deletion cascades properly
- [ ] Transaction rollback on failures

### Performance Tests
- [ ] 1000+ nodes per user
- [ ] 100+ moment reordering
- [ ] Concurrent user operations
- [ ] Bulk import scenarios