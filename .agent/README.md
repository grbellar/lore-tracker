# Lore Tracker Documentation

This directory contains comprehensive documentation for the Lore Tracker project. Use this index to navigate to the information you need.

## Quick Start

**New to the project?** Start here:
1. Read [Project Architecture](./System/project_architecture.md) for a complete overview
2. Review [Database Schema](./System/database_schema.md) to understand data models
3. Check [Authentication System](./System/authentication_system.md) to understand auth flow

## Documentation Structure

### 📁 System Documentation

Core system architecture, technical stack, and infrastructure documentation.

- **[Project Architecture](./System/project_architecture.md)**
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

- **[Database Schema](./System/database_schema.md)**
  - Database configuration (PostgreSQL + Prisma)
  - Current schema (authentication models: User, Account, Session, VerificationToken)
  - Planned schema (Universe, Book, Chapter, Entity types, Moment, Relationship)
  - Database access patterns and Prisma client usage
  - Migration workflow
  - Security considerations (password hashing, cascading deletes)
  - Performance considerations (connection pooling, indexes)
  - Future schema considerations (multi-tenancy, soft deletes, versioning)

- **[Authentication System](./System/authentication_system.md)**
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

### 📁 Tasks Documentation

Product requirements documents (PRDs) and implementation plans for features.

**Available Tasks:**
- **[Authentication Setup & Verification](./Tasks/authentication_setup_verification.md)**
  - Complete authentication system setup and verification
  - NextAuth.js v4 with Credentials Provider
  - Prisma schema with User, Account, Session, VerificationToken
  - bcrypt password hashing
  - Sign up/sign in pages
  - Route protection middleware
  - Status: ✅ Completed

**What belongs here:**
- Feature PRDs with requirements and user stories
- Implementation plans with technical specifications
- Task breakdowns and development roadmaps
- Feature-specific documentation

### 📁 SOP Documentation

Standard Operating Procedures and best practices for common development tasks.

**Available SOPs:**
- **[Route Protection Patterns](./SOP/route_protection_patterns.md)**
  - How to protect routes with middleware
  - Server component authentication
  - Client component authentication with useSession
  - API route protection patterns
  - Server action protection
  - Common patterns and troubleshooting

**What belongs here:**
- How to add a new database model and migration
- How to create a new page route
- How to add a new API endpoint
- How to create a new reusable component
- How to update the design system
- Deployment procedures
- Testing procedures

## Getting Started with Development

### Prerequisites
- Node.js (latest LTS version)
- PostgreSQL database
- npm or yarn

### Setup
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
```bash
npm run dev      # Start development server with Turbopack
npm run build    # Build for production with Turbopack
npm start        # Start production server
npm run lint     # Run ESLint
```

## Project Status

### ✅ Completed
- Authentication system (sign up, sign in, JWT sessions)
- Full UI/UX design for all main pages
- Component architecture established
- Design system with Tailwind CSS v4
- Responsive layouts for mobile and desktop
- Route protection middleware

### 🚧 In Progress
- Database schema design for lore entities
- Planning API architecture

### 📋 Planned
- Universe, Book, and Chapter models
- Entity models (Character, Location, Item, Organization)
- Moment and timeline functionality
- Entity relationships system
- Custom fields for entities
- Search functionality
- Graph view for entity relationships
- Real-time collaboration features

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
| bcryptjs | 3.0.2 | Password hashing |
| Lucide React | 0.545.0 | Icons |

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
1. Update relevant System docs if architecture changed
2. Create or update Task doc with implementation details
3. Add or update SOP if new patterns were established
4. Update this README if new docs were added

**When fixing a bug:**
1. Update SOP if the bug revealed a process issue
2. Update System docs if a misconception was documented

**When adding new patterns:**
1. Document the pattern in SOP
2. Provide examples and rationale
3. Link from relevant System docs

### Documentation Best Practices

- **Keep it current**: Update docs immediately after changes
- **Be specific**: Include file paths, code examples, and clear instructions
- **Link related docs**: Use "Related docs" section at the top of each file
- **Use examples**: Show don't just tell
- **Explain why**: Document the reasoning behind decisions
- **Version control**: Commit doc updates with related code changes

## Contributing

When contributing to this project:

1. **Read the docs**: Start with [Project Architecture](./System/project_architecture.md)
2. **Follow patterns**: Check existing code for established patterns
3. **Update docs**: Keep documentation in sync with code changes
4. **Ask questions**: If something is unclear, ask before implementing

## Getting Help

- **Architecture questions**: Check [Project Architecture](./System/project_architecture.md)
- **Database questions**: Check [Database Schema](./System/database_schema.md)
- **Auth questions**: Check [Authentication System](./System/authentication_system.md)
- **Process questions**: Check SOP docs (when available)
- **Feature questions**: Check Tasks docs (when available)

## Contact & Support

For questions or issues not covered in the documentation, please contact the development team or create an issue in the project repository.

---

**Last Updated:** 2025-10-07
**Documentation Version:** 1.0.0
