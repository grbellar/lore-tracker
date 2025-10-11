# Docker Setup Guide

## Overview

The Lore Tracker application is fully dockerized with support for both development and production environments. The setup uses Docker Compose to orchestrate three services:

- **Web**: Next.js 15 application (React 19, TypeScript)
- **PostgreSQL 18**: User accounts, authentication, and subscriptions
- **Neo4j 5**: Story data (characters, locations, events, relationships)

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Docker Network                           │
│                  (loretracker-network)                       │
│                                                               │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐   │
│  │   Next.js    │   │  PostgreSQL  │   │    Neo4j     │   │
│  │   Web App    │   │      18      │   │      5       │   │
│  │              │   │              │   │              │   │
│  │  Port: 3000  │   │  Port: 5432  │   │ Ports: 7474  │   │
│  │              │   │              │   │        7687  │   │
│  └──────────────┘   └──────────────┘   └──────────────┘   │
│         │                  │                   │            │
│         └──────────────────┴───────────────────┘            │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

## Files Structure

```
lore-tracker-react/
├── Dockerfile                    # Production build (multi-stage)
├── Dockerfile.dev               # Development build
├── docker-compose.yml           # Production compose file
├── docker-compose.dev.yml       # Development compose file
├── .dockerignore               # Files to exclude from Docker build
├── scripts/
│   └── docker-entrypoint.sh    # Container initialization script
└── neo4j/
    └── init.cypher             # Neo4j schema initialization
```

## Quick Start

### Production Environment

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Stop and remove volumes (⚠️ deletes all data)
docker-compose down -v
```

### Development Environment

```bash
# Start all services with hot reload
docker-compose -f docker-compose.dev.yml up

# Run in background
docker-compose -f docker-compose.dev.yml up -d

# Stop all services
docker-compose -f docker-compose.dev.yml down
```

## Detailed Setup Instructions

### 1. Prerequisites

- Docker Desktop (Mac/Windows) or Docker Engine (Linux)
- Docker Compose v2.0+
- 4GB+ RAM available for Docker

### 2. Environment Configuration

Copy the example environment file and configure it for Docker:

```bash
cp .env.example .env
```

Edit `.env` and uncomment the Docker-specific configuration:

```bash
# PostgreSQL (Docker)
DATABASE_URL="postgresql://postgres:secret@postgres:5432/loretracker?schema=public"

# Neo4j (Docker)
NEO4J_URI=bolt://neo4j:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=secret

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-generated-secret-here

# Generate a secure secret with:
# openssl rand -base64 32
```

### 3. Build and Start Services

#### Production Mode

```bash
# Build images
docker-compose build

# Start services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f web
```

#### Development Mode

```bash
# Build and start with hot reload
docker-compose -f docker-compose.dev.yml up

# The application will be available at:
# - Web: http://localhost:3000
# - Neo4j Browser: http://localhost:7474
# - PostgreSQL: localhost:5432
```

### 4. Initialize Neo4j Schema

The Neo4j schema is automatically initialized when the container starts. To manually run the initialization:

```bash
# Connect to Neo4j container
docker exec -it loretracker-neo4j cypher-shell -u neo4j -p secret

# Run the initialization script
:source /var/lib/neo4j/import/init.cypher
```

### 5. Database Migrations

Prisma migrations are automatically applied during container startup via the `docker-entrypoint.sh` script.

To run migrations manually:

```bash
# Connect to web container
docker exec -it loretracker-web sh

# Run migrations
npx prisma migrate deploy

# Generate Prisma Client
npx prisma generate
```

## Service Details

### Web Application

**Image**: Custom (built from `Dockerfile`)
**Port**: 3000
**Depends on**: postgres, neo4j

**Environment Variables**:
- `DATABASE_URL`: PostgreSQL connection string
- `NEO4J_URI`: Neo4j bolt connection
- `NEO4J_USER`: Neo4j username
- `NEO4J_PASSWORD`: Neo4j password
- `NEXTAUTH_URL`: Application URL
- `NEXTAUTH_SECRET`: JWT secret

**Health Check**: HTTP GET to `/api/health` every 30s

### PostgreSQL 18

**Image**: `postgres:18`
**Port**: 5432
**Database**: loretracker
**Username**: postgres
**Password**: secret

**Data Persistence**: `postgres_data` volume mounted at `/var/lib/postgresql/data`

**Health Check**: `pg_isready` command every 10s

### Neo4j 5

**Image**: `neo4j:5`
**Ports**:
- 7474 (HTTP Browser UI)
- 7687 (Bolt protocol)

**Credentials**:
- Username: neo4j
- Password: secret

**Data Persistence**:
- `neo4j_data` volume mounted at `/data`
- `neo4j_logs` volume mounted at `/logs`

**Plugins**: APOC enabled

**Memory Configuration**:
- Heap initial: 512m
- Heap max: 2G
- Page cache: 512m

**Health Check**: `cypher-shell` query every 10s

## Docker Commands Reference

### Building

```bash
# Build production image
docker-compose build

# Build development image
docker-compose -f docker-compose.dev.yml build

# Build with no cache (clean build)
docker-compose build --no-cache

# Build specific service
docker-compose build web
```

### Running

```bash
# Start all services
docker-compose up

# Start in background (detached)
docker-compose up -d

# Start specific service
docker-compose up web

# Recreate containers
docker-compose up --force-recreate
```

### Stopping

```bash
# Stop all services
docker-compose down

# Stop and remove volumes
docker-compose down -v

# Stop specific service
docker-compose stop web

# Remove stopped containers
docker-compose rm
```

### Logs

```bash
# View all logs
docker-compose logs

# Follow logs (real-time)
docker-compose logs -f

# View logs for specific service
docker-compose logs web

# Last 100 lines
docker-compose logs --tail=100
```

### Executing Commands

```bash
# Execute command in web container
docker exec -it loretracker-web sh

# Run Prisma commands
docker exec -it loretracker-web npx prisma migrate dev

# Connect to PostgreSQL
docker exec -it loretracker-postgres psql -U postgres -d loretracker

# Connect to Neo4j shell
docker exec -it loretracker-neo4j cypher-shell -u neo4j -p secret
```

### Inspecting

```bash
# View running containers
docker-compose ps

# View resource usage
docker stats

# Inspect specific container
docker inspect loretracker-web

# View networks
docker network ls

# View volumes
docker volume ls
```

## Development Workflow

### Hot Reload Setup

The development Docker Compose file (`docker-compose.dev.yml`) is configured for hot reload:

1. Source code is mounted as volumes
2. Next.js dev server runs with Turbopack
3. Changes to code are automatically reflected

**Mounted Directories**:
- `./app` → `/app/app`
- `./src` → `/app/src`
- `./public` → `/app/public`
- `./prisma` → `/app/prisma`

### Making Schema Changes

**PostgreSQL**:
```bash
# Edit prisma/schema.prisma locally

# Create migration
docker exec -it loretracker-web-dev npx prisma migrate dev --name your_migration_name

# Migration runs automatically on container restart
```

**Neo4j**:
```bash
# Edit neo4j/init.cypher locally

# Restart Neo4j service
docker-compose -f docker-compose.dev.yml restart neo4j

# Run initialization manually
docker exec -it loretracker-neo4j-dev cypher-shell -u neo4j -p secret < neo4j/init.cypher
```

### Debugging

**Enable Node.js Debugger**:

Port 9229 is exposed in development mode. Connect your IDE debugger to `localhost:9229`.

**VS Code Launch Configuration**:
```json
{
  "type": "node",
  "request": "attach",
  "name": "Docker: Attach to Node",
  "remoteRoot": "/app",
  "localRoot": "${workspaceFolder}",
  "port": 9229
}
```

## Production Deployment

### Environment Variables

Update `.env` for production:

```bash
# Use strong passwords
POSTGRES_PASSWORD=<strong-random-password>
NEO4J_PASSWORD=<strong-random-password>

# Generate secure secret
NEXTAUTH_SECRET=$(openssl rand -base64 32)

# Update URLs
NEXTAUTH_URL=https://your-domain.com

# Set production mode
NODE_ENV=production
```

### Build and Deploy

```bash
# Build production images
docker-compose build

# Start in production mode
docker-compose up -d

# View logs
docker-compose logs -f

# Monitor health
docker-compose ps
```

### Backup Data

**PostgreSQL**:
```bash
# Backup
docker exec loretracker-postgres pg_dump -U postgres loretracker > backup.sql

# Restore
docker exec -i loretracker-postgres psql -U postgres loretracker < backup.sql
```

**Neo4j**:
```bash
# Backup (using docker volumes)
docker run --rm -v loretracker_neo4j_data:/data -v $(pwd):/backup alpine tar czf /backup/neo4j_backup.tar.gz -C /data .

# Restore
docker run --rm -v loretracker_neo4j_data:/data -v $(pwd):/backup alpine tar xzf /backup/neo4j_backup.tar.gz -C /data
```

## Troubleshooting

### Issue: Services won't start

**Solution**: Check Docker daemon and available resources
```bash
docker info
docker-compose ps
docker-compose logs
```

### Issue: Database connection refused

**Solution**: Wait for health checks to pass
```bash
# Check health status
docker-compose ps

# View database logs
docker-compose logs postgres
docker-compose logs neo4j
```

### Issue: Port already in use

**Solution**: Change port mappings in `docker-compose.yml`
```yaml
services:
  web:
    ports:
      - "3001:3000"  # Change 3001 to available port
```

### Issue: Out of disk space

**Solution**: Clean up Docker resources
```bash
# Remove stopped containers
docker container prune

# Remove unused images
docker image prune

# Remove unused volumes (⚠️ deletes data)
docker volume prune

# Clean everything (⚠️ nuclear option)
docker system prune -a --volumes
```

### Issue: Migration fails

**Solution**: Reset database and re-run migrations
```bash
# Stop services
docker-compose down -v

# Start services
docker-compose up -d

# Migrations run automatically via entrypoint script
```

### Issue: Neo4j browser can't connect

**Solution**: Check Neo4j is running and credentials are correct
```bash
# Check Neo4j logs
docker-compose logs neo4j

# Verify Neo4j is responding
curl http://localhost:7474

# Test Bolt connection
docker exec -it loretracker-neo4j cypher-shell -u neo4j -p secret "RETURN 1"
```

### Issue: Hot reload not working in development

**Solution**:
1. Ensure volumes are mounted correctly
2. Check file permissions
3. Restart the web service

```bash
docker-compose -f docker-compose.dev.yml restart web
docker-compose -f docker-compose.dev.yml logs -f web
```

## Performance Optimization

### Production Builds

The production `Dockerfile` uses multi-stage builds:

1. **Stage 1 (deps)**: Install dependencies
2. **Stage 2 (builder)**: Build Next.js app
3. **Stage 3 (runner)**: Minimal runtime image

This reduces the final image size by ~60%.

### Memory Allocation

Adjust memory limits in `docker-compose.yml`:

```yaml
services:
  neo4j:
    environment:
      NEO4J_dbms_memory_heap_initial__size: 512m
      NEO4J_dbms_memory_heap_max__size: 2G
      NEO4J_dbms_memory_pagecache_size: 512m
```

### Resource Limits

Add resource constraints to prevent services from consuming all system resources:

```yaml
services:
  web:
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
```

## Security Considerations

### Production Checklist

- [ ] Change default passwords in `.env`
- [ ] Generate secure `NEXTAUTH_SECRET`
- [ ] Don't expose database ports externally (remove port mappings)
- [ ] Use Docker secrets for sensitive data
- [ ] Enable HTTPS/TLS in production
- [ ] Regular security updates (`docker-compose pull`)
- [ ] Implement backup strategy
- [ ] Set up monitoring and alerting
- [ ] Configure firewalls properly
- [ ] Use non-root user (already configured)

### Secure Password Generation

```bash
# Generate PostgreSQL password
openssl rand -base64 32

# Generate Neo4j password
openssl rand -base64 32

# Generate NextAuth secret
openssl rand -base64 32
```

## Monitoring

### Health Checks

All services have health checks configured:

```bash
# Check service health
docker-compose ps

# Detailed health status
docker inspect --format='{{json .State.Health}}' loretracker-web | jq
```

### Resource Usage

```bash
# Monitor resource usage
docker stats

# Specific service
docker stats loretracker-web
```

### Logs

```bash
# Follow all logs
docker-compose logs -f

# Filter by service
docker-compose logs -f web

# Search logs
docker-compose logs | grep ERROR
```

## Additional Resources

- [Database Spec](./../SOP/database_spec.md) - Complete database schema
- [Project Architecture](./../System/project_architecture.md) - Application architecture
- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Reference](https://docs.docker.com/compose/compose-file/)
- [Neo4j Docker Guide](https://neo4j.com/developer/docker/)
- [PostgreSQL Docker Guide](https://hub.docker.com/_/postgres)

---

**Last Updated**: 2025-10-11
**Version**: 1.0.0
