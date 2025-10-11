#!/bin/bash
set -e

echo "🚀 Starting Lore Tracker entrypoint script..."

# Function to wait for PostgreSQL
wait_for_postgres() {
  echo "⏳ Waiting for PostgreSQL to be ready..."
  until node -e "require('net').createConnection({host: 'postgres', port: 5432}).on('connect', () => process.exit(0)).on('error', () => process.exit(1))"; do
    echo "   PostgreSQL is unavailable - sleeping"
    sleep 2
  done
  echo "✅ PostgreSQL is ready!"
}

# Function to wait for Neo4j
wait_for_neo4j() {
  echo "⏳ Waiting for Neo4j to be ready..."
  local max_attempts=30
  local attempt=0

  until curl -f http://neo4j:7474 > /dev/null 2>&1; do
    attempt=$((attempt + 1))
    if [ $attempt -ge $max_attempts ]; then
      echo "❌ Neo4j failed to start after $max_attempts attempts"
      exit 1
    fi
    echo "   Neo4j is unavailable - sleeping (attempt $attempt/$max_attempts)"
    sleep 2
  done
  echo "✅ Neo4j is ready!"
}

# Wait for databases to be ready
wait_for_postgres
wait_for_neo4j

# Generate Prisma Client
echo "📦 Generating Prisma Client..."
npx prisma generate

# Run Prisma migrations
echo "🔄 Running Prisma migrations..."
npx prisma migrate deploy

# Initialize Neo4j schema (indexes and constraints)
echo "🔧 Initializing Neo4j schema..."
if [ -f "/app/neo4j/init.cypher" ] || [ -f "./neo4j/init.cypher" ]; then
  echo "   Found init.cypher file"
  # Note: This will be handled by the application on first run
  # or can be manually executed via cypher-shell
  echo "   Neo4j initialization script should be run manually or by the application"
else
  echo "   No Neo4j init script found, skipping..."
fi

echo "✅ Initialization complete!"
echo ""
echo "🌐 Starting Next.js server..."

# Start Next.js server
exec node server.js
