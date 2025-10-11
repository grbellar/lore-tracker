// Neo4j Schema Initialization Script
// Based on database_spec.md - Story Lore Database Design Specification
// This script creates all necessary indexes and constraints for the Lore Tracker application

// ============================================================================
// USER ISOLATION INDEXES (Critical for performance)
// ============================================================================

// General user isolation index for all nodes
CREATE INDEX user_isolation IF NOT EXISTS FOR (n) ON (n.user_id);

// ============================================================================
// LABEL-SPECIFIC USER INDEXES
// ============================================================================

// Character nodes
CREATE INDEX character_user IF NOT EXISTS FOR (c:Character) ON (c.user_id);

// Location nodes
CREATE INDEX location_user IF NOT EXISTS FOR (l:Location) ON (l.user_id);

// Moment nodes
CREATE INDEX moment_user IF NOT EXISTS FOR (m:Moment) ON (m.user_id);

// Item nodes
CREATE INDEX item_user IF NOT EXISTS FOR (i:Item) ON (i.user_id);

// Organization nodes
CREATE INDEX organization_user IF NOT EXISTS FOR (o:Organization) ON (o.user_id);

// ============================================================================
// UNIQUE CONSTRAINTS (Ensure data integrity)
// ============================================================================

// Character ID uniqueness
CREATE CONSTRAINT character_id_unique IF NOT EXISTS
FOR (c:Character) REQUIRE c.id IS UNIQUE;

// Location ID uniqueness
CREATE CONSTRAINT location_id_unique IF NOT EXISTS
FOR (l:Location) REQUIRE l.id IS UNIQUE;

// Moment ID uniqueness
CREATE CONSTRAINT moment_id_unique IF NOT EXISTS
FOR (m:Moment) REQUIRE m.id IS UNIQUE;

// Item ID uniqueness
CREATE CONSTRAINT item_id_unique IF NOT EXISTS
FOR (i:Item) REQUIRE i.id IS UNIQUE;

// Organization ID uniqueness
CREATE CONSTRAINT organization_id_unique IF NOT EXISTS
FOR (o:Organization) REQUIRE o.id IS UNIQUE;

// ============================================================================
// RELATIONSHIP INDEXES
// ============================================================================

// Index on user_id for all relationships (for efficient filtering)
CREATE INDEX rel_user_id IF NOT EXISTS FOR ()-[r]-() ON (r.user_id);

// ============================================================================
// ADDITIONAL PERFORMANCE INDEXES (Optional but recommended)
// ============================================================================

// Name indexes for faster searching by name
CREATE INDEX character_name IF NOT EXISTS FOR (c:Character) ON (c.name);
CREATE INDEX location_name IF NOT EXISTS FOR (l:Location) ON (l.name);
CREATE INDEX item_name IF NOT EXISTS FOR (i:Item) ON (i.name);
CREATE INDEX organization_name IF NOT EXISTS FOR (o:Organization) ON (o.name);

// Moment title and timestamp for timeline queries
CREATE INDEX moment_title IF NOT EXISTS FOR (m:Moment) ON (m.title);
CREATE INDEX moment_timestamp IF NOT EXISTS FOR (m:Moment) ON (m.timestamp);

// Composite indexes for common query patterns
CREATE INDEX character_user_name IF NOT EXISTS FOR (c:Character) ON (c.user_id, c.name);
CREATE INDEX moment_user_timestamp IF NOT EXISTS FOR (m:Moment) ON (m.user_id, m.timestamp);

// ============================================================================
// INITIALIZATION COMPLETE
// ============================================================================

// Return success message
RETURN "Neo4j schema initialized successfully!" AS status,
       "All indexes and constraints created" AS message,
       datetime() AS timestamp;
