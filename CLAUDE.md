# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# DOCS
We keep all important docs in `.agent` folder and keep updating them, structure like below:

```
.agent/
├── README.md                           # Index of all documentation
├── tasks/                              # Completed feature implementations & task docs
│   ├── authentication_setup_verification.md
│   ├── entity_view_page.md
│   ├── notion_style_editor.md
│   └── ...
├── docs/                               # Core system documentation
│   ├── project_architecture.md        # Project structure, tech stack, integration points
│   ├── postgres_user_schema.md        # PostgreSQL schema for users & auth
│   ├── authentication_system.md       # Auth flow & security
│   ├── text_editor_system.md          # Tiptap editor documentation
│   ├── testing_guide.md               # Test suite & coverage
│   └── ...
└── prds/                               # Product requirements & technical specs
    ├── backend_overview.md            # Two-database architecture (PostgreSQL + Neo4j)
    ├── docker_setup.md                # Docker & containerization
    ├── neo4j_query_patterns.md        # Neo4j best practices
    ├── route_protection_patterns.md   # Auth middleware patterns
    └── ...
```

We should always update .agent docs after we implement new features or make changes to the codebase, to make sure it fully reflect the up to date information

BEFORE YOU PLAN ANY IMPLEMENTATION, always read the .agent/README first to get context

## Development Environment

**IMPORTANT:** The project runs in Docker containers. THE SERVER IS USUALLY ALREADY RUNNING AND YOU DON'T NEED TO START IT TO TEST.

### Docker Commands

```bash
# Check if services are running
docker ps

# Start all services (web app, PostgreSQL, Neo4j)
docker-compose up

# Start services in background
docker-compose up -d

# Stop all services
docker-compose down

# View logs
docker logs loretracker-web-dev -f        # Web app logs
docker logs loretracker-postgres-dev -f   # PostgreSQL logs
docker logs loretracker-neo4j-dev -f      # Neo4j logs

# Restart web app only
docker-compose restart web

# Rebuild after dependency changes
docker-compose up --build

# Run commands inside container
docker-compose exec web npm run lint      # Run linter
docker-compose exec web npm test          # Run tests
docker-compose exec web npm run build     # Build for production
```

### Access Points
- **Web App**: http://localhost:3000
- **Neo4j Browser**: http://localhost:7474 (username: `neo4j`, password: `testpassword`)
- **PostgreSQL**: localhost:5432

### Local Development (Without Docker)

If running locally without Docker:

```bash
npm run dev            # Start development server with Turbopack
npm run build          # Build for production with Turbopack
npm start              # Start production server
npm run lint           # Run ESLint
npm test               # Run test suite
npm run test:watch     # Run tests in watch mode
npm run test:coverage  # Run tests with coverage report
```