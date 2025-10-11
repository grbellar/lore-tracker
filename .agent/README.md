# Lore Tracker Documentation

This directory contains comprehensive documentation for the Lore Tracker project. Use this index to navigate to the information you need.

## Quick Start

**New to the project?** Start here:
1. Read [Project Architecture](./docs/project_architecture.md) for a complete overview
2. Review [PostgreSQL User Schema](./docs/postgres_user_schema.md) and [Backend Overview](./prds/backend_overview.md) to understand data models
3. Check [Authentication System](./docs/authentication_system.md) to understand auth flow
4. Explore [Text Editor System](./docs/text_editor_system.md) to learn about the writing interface
5. Review [Testing Guide](./docs/testing_guide.md) to understand test coverage and run tests

## Documentation Structure

### 📁 docs/ - System Documentation

Core system architecture, technical stack, and infrastructure documentation.

- **[Project Architecture](./docs/project_architecture.md)**
  - Complete project overview and goals
  - Tech stack details (Next.js 15, React 19, TypeScript, Tailwind CSS v4)
  - Project structure and file organization
  - Page structure (Dashboard, Write, Entity, Timeline)
  - Component architecture and patterns
  - Design system and UI/UX patterns
  - State management approach
  - Integration points
  - Development workflow and commands
  - Current implementation status and roadmap

- **[PostgreSQL User Schema](./docs/postgres_user_schema.md)**
  - Database configuration (PostgreSQL + Prisma)
  - Current schema (authentication models: User, Account, Session, VerificationToken)
  - Planned schema (Universe, Book, Chapter, Entity types, Moment, Relationship)
  - Database access patterns and Prisma client usage
  - Migration workflow
  - Security considerations (password hashing, cascading deletes)
  - Performance considerations (connection pooling, indexes)
  - Future schema considerations (multi-tenancy, soft deletes, versioning)

- **[Authentication System](./docs/authentication_system.md)**
  - NextAuth.js v4 architecture
  - Authentication flow (sign up, sign in, session management)
  - Component breakdown:
    - NextAuth configuration
    - Sign up API route
    - Password utilities (bcrypt)
    - Route protection middleware
    - Session provider
    - TypeScript type extensions
  - Client-side components (sign in/up pages)
  - JWT strategy and session management
  - Security considerations (password security, session security, input validation)
  - Environment variables
  - Future enhancements (email verification, OAuth, 2FA)
  - Troubleshooting guide

- **[Text Editor System](./docs/text_editor_system.md)**
  - Notion-style WYSIWYG editor built with Tiptap 3.6.5
  - Component architecture (Editor, SlashMenu, MentionExtension, MentionList)
  - Slash commands for quick formatting (/, headings, lists, quotes, code blocks)
  - Entity mentions with @ symbol and autocomplete
  - Real-time character and word counting
  - Integration with Write page (/write route)
  - Design system integration (dark theme, Lexend font, color palette)
  - Data flow and state management
  - Content storage formats (HTML and JSON)
  - Performance considerations and optimization strategies
  - Security considerations (XSS prevention, input validation)
  - Future enhancements (AI integration, collaborative editing, version history)
  - Keyboard shortcuts and navigation
  - Troubleshooting guide and testing checklist

- **[Testing Guide](./docs/testing_guide.md)**
  - Comprehensive authentication testing with Jest
  - 113 passing tests covering critical functionality
  - Unit tests for password hashing, verification, and Neo4j auth
  - **CRITICAL**: User isolation tests for Neo4j (no cross-user data pollution)
  - Integration tests for error handling and logging
  - Test utilities and mocking strategies
  - Test coverage metrics and CI/CD recommendations
  - Security testing highlights (timing attacks, parameter injection)
  - Known limitations and future improvements

### 📁 tasks/ - Implementation Tasks

Completed and in-progress feature implementation documentation.

**Available Tasks:**
- **[Authentication Setup & Verification](./tasks/authentication_setup_verification.md)**
  - Complete authentication system setup and verification
  - NextAuth.js v4 with Credentials Provider
  - Prisma schema with User, Account, Session, VerificationToken
  - bcrypt password hashing
  - Sign up/sign in pages
  - Route protection middleware
  - Status: ✅ Completed

- **[Entity View Page Implementation](./tasks/entity_view_page.md)**
  - Unified entity listing page for all entity types
  - Grid/list view toggle with responsive layouts
  - Filter by entity type via URL parameters
  - Label-based sub-filtering (Protagonist, Planet, Weapon, etc.)
  - Real-time search functionality
  - Type-specific color coding and visual styling
  - Navigation flow with back button support
  - Status: ✅ Completed

- **[Notion-Style Text Editor](./tasks/notion_style_editor.md)**
  - Interactive Notion-style WYSIWYG text editor
  - Tiptap integration with StarterKit extensions
  - Slash commands for formatting (headings, lists, quotes, code)
  - Entity mentions with @ symbol and autocomplete
  - Real-time character and word counting
  - Clean, minimal, distraction-free interface
  - Dark theme integration with Lexend font
  - Status: ✅ Completed

**What belongs here:**
- Feature implementation documentation with completion status
- Implementation plans with technical specifications
- Task breakdowns and development roadmaps
- Feature-specific notes and learnings

### 📁 prds/ - Product Requirements & Technical Specs

Product requirements documents, technical specifications, and best practices.

**Available PRDs:**
- **[Backend Overview](./prds/backend_overview.md)**
  - Two-database system architecture (PostgreSQL + Neo4j)
  - PostgreSQL schema for users, authentication, subscriptions
  - Neo4j schema for story data (characters, locations, events, relationships)
  - User data isolation patterns and security rules
  - API implementation examples and query patterns
  - Performance optimization strategies
  - Environment variables and Docker setup
  - Migration scripts and testing checklist

- **[Docker Setup](./prds/docker_setup.md)**
  - Docker containerization setup and configuration
  - Development and production container strategies
  - Service orchestration with Docker Compose
  - Volume management and persistence
  - Environment configuration

- **[Neo4j Query Patterns](./prds/neo4j_query_patterns.md)**
  - Common Neo4j query patterns and best practices
  - User isolation query patterns
  - Relationship traversal strategies
  - Performance optimization techniques
  - Index usage and query optimization

- **[Route Protection Patterns](./prds/route_protection_patterns.md)**
  - How to protect routes with middleware
  - Server component authentication
  - Client component authentication with useSession
  - API route protection patterns
  - Server action protection
  - Common patterns and troubleshooting

**What belongs here:**
- Product requirements documents with feature specifications
- Technical architecture specifications
- Best practices and standard operating procedures
- Development patterns and guidelines

## Getting Started with Development

### Prerequisites
- Docker and Docker Compose
- Node.js (latest LTS version) - for local development without Docker

### Docker Setup (Recommended)

The project uses Docker for local development with PostgreSQL and Neo4j databases.

```bash
# Start all services (web app, PostgreSQL, Neo4j)
docker-compose up

# Start services in detached mode (background)
docker-compose up -d

# Stop all services
docker-compose down

# View logs
docker logs loretracker-web-dev -f        # Web app logs
docker logs loretracker-postgres-dev -f   # PostgreSQL logs
docker logs loretracker-neo4j-dev -f      # Neo4j logs

# Restart a specific service
docker-compose restart web

# Rebuild after dependency changes
docker-compose up --build
```

**Access Points:**
- **Web App**: http://localhost:3000
- **Neo4j Browser**: http://localhost:7474 (username: `neo4j`, password: `testpassword`)
- **PostgreSQL**: localhost:5432 (accessible via any PostgreSQL client)

### Local Setup (Without Docker)

If you prefer to run without Docker:

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL

# Run database migrations
npx prisma migrate dev

# Start development server
npm run dev
```

### Development Commands

**Docker Commands:**
```bash
docker-compose up              # Start all services
docker-compose down            # Stop all services
docker-compose restart web     # Restart web app
docker-compose logs -f web     # Follow web app logs
docker-compose exec web npm run lint  # Run linter in container
docker-compose exec web npm test      # Run tests in container
```

**NPM Commands (Local or Inside Container):**
```bash
npm run dev            # Start development server with Turbopack
npm run build          # Build for production with Turbopack
npm start              # Start production server
npm run lint           # Run ESLint
npm test               # Run test suite
npm run test:watch     # Run tests in watch mode
npm run test:coverage  # Run tests with coverage report
```

## Project Status

### ✅ Completed
- Authentication system (sign up, sign in, JWT sessions)
- **Authentication test suite (113 passing tests)**
- **User isolation testing for Neo4j**
- Full UI/UX design for all main pages
- Component architecture established
- Design system with Tailwind CSS v4
- Responsive layouts for mobile and desktop
- Route protection middleware
- Entity listing page with grid/list views
- Entity type filtering and URL-based navigation
- Real-time search functionality
- Type-specific visual styling system
- Entity detail page with URL parameters
- Label-based sub-filtering UI
- Notion-style text editor with Tiptap
- Slash commands for quick formatting
- Entity mentions with @ autocomplete
- Real-time character and word counting

### 🚧 In Progress
- Database schema design for lore entities
- Planning API architecture
- Entity label assignment (UI complete, backend pending)

### 📋 Planned
- Universe, Book, and Chapter models
- Entity models with relationships (Character, Location, Item, Organization)
- Moment and timeline functionality
- Entity relationships system
- Custom fields for entities
- Advanced search with filters
- Graph view for entity relationships
- Real-time collaboration features
- Rich text editor integration

## Key Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 15.5.4 | React framework with App Router |
| React | 19.1.0 | UI library |
| TypeScript | 5 | Type safety |
| Tailwind CSS | v4 | Styling |
| NextAuth.js | 4.24.11 | Authentication |
| Prisma | 6.16.3 | ORM |
| PostgreSQL | Latest | Database |
| Neo4j | 5+ | Graph database |
| Tiptap | 3.6.5 | Rich text editor |
| bcryptjs | 3.0.2 | Password hashing |
| Jest | 30.2.0 | Testing framework |
| Lucide React | 0.545.0 | Icons |
| tippy.js | 6.3.7 | Tooltip/popover positioning |

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Browser                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │  Dashboard  │  │    Write    │  │   Entity    │  ...    │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
└─────────────────────────────────────────────────────────────┘
                            │
                            ├─── React 19 + Next.js 15
                            ├─── Tailwind CSS v4
                            └─── Lucide Icons
                            │
┌─────────────────────────────────────────────────────────────┐
│                     Next.js App Router                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   Pages     │  │ API Routes  │  │ Middleware  │        │
│  │  (Server)   │  │  (Serverless)│  │  (Auth)     │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
└─────────────────────────────────────────────────────────────┘
                            │
                            ├─── NextAuth.js (JWT)
                            └─── Prisma ORM
                            │
┌─────────────────────────────────────────────────────────────┐
│                    PostgreSQL Database                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │    User     │  │   Session   │  │  (Future:   │        │
│  │   Account   │  │Verification │  │   Entities) │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
└─────────────────────────────────────────────────────────────┘
```

## Documentation Maintenance

### When to Update Documentation

**After implementing a feature:**
1. Update relevant docs/ files if architecture changed
2. Create or update tasks/ doc with implementation details
3. Add or update prds/ if new patterns were established
4. Update this README if new docs were added

**When fixing a bug:**
1. Update prds/ if the bug revealed a process issue
2. Update docs/ files if a misconception was documented

**When adding new patterns:**
1. Document the pattern in prds/
2. Provide examples and rationale
3. Link from relevant docs/ files

### Documentation Best Practices

- **Keep it current**: Update docs immediately after changes
- **Be specific**: Include file paths, code examples, and clear instructions
- **Link related docs**: Use "Related docs" section at the top of each file
- **Use examples**: Show don't just tell
- **Explain why**: Document the reasoning behind decisions
- **Version control**: Commit doc updates with related code changes

## Contributing

When contributing to this project:

1. **Read the docs**: Start with [Project Architecture](./docs/project_architecture.md)
2. **Follow patterns**: Check existing code for established patterns
3. **Update docs**: Keep documentation in sync with code changes
4. **Ask questions**: If something is unclear, ask before implementing

## Getting Help

- **Architecture questions**: Check [Project Architecture](./docs/project_architecture.md)
- **Database questions**: Check [PostgreSQL User Schema](./docs/postgres_user_schema.md) and [Backend Overview](./prds/backend_overview.md)
- **Auth questions**: Check [Authentication System](./docs/authentication_system.md)
- **Testing questions**: Check [Testing Guide](./docs/testing_guide.md)
- **Editor questions**: Check [Text Editor System](./docs/text_editor_system.md)
- **Neo4j questions**: Check [Neo4j Query Patterns](./prds/neo4j_query_patterns.md)
- **Docker questions**: Check [Docker Setup](./prds/docker_setup.md)
- **Route protection questions**: Check [Route Protection Patterns](./prds/route_protection_patterns.md)
- **Feature implementation**: Check tasks/ folder for completed implementations

## Contact & Support

For questions or issues not covered in the documentation, please contact the development team or create an issue in the project repository.

---

**Last Updated:** 2025-10-11
**Documentation Version:** 1.2.0
**Changes:** Updated folder structure (System→docs, Tasks→tasks, SOP→prds), Added Docker development instructions
