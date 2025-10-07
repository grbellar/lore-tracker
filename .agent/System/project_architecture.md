# Project Architecture

**Related docs:**
- [Database Schema](./database_schema.md)
- [Authentication System](./authentication_system.md)

## Project Overview

Lore Tracker is a narrative content management application designed for writers to manage complex story universes. The application enables users to track books, chapters, characters, locations, organizations, and their relationships across a timeline.

**Current Status:** Early development phase with authentication implemented and UI/UX fully designed. The application uses hardcoded mock data throughout the frontend while the backend infrastructure (NextAuth + Prisma + PostgreSQL) is operational.

## Tech Stack

### Frontend
- **Next.js 15.5.4**: React framework using App Router architecture
- **React 19.1.0**: UI library with latest concurrent features
- **TypeScript 5**: Strict type checking enabled
- **Tailwind CSS v4**: Utility-first CSS with `@tailwindcss/postcss`
- **Lucide React 0.545.0**: Icon library for UI components

### Backend
- **Next.js API Routes**: Serverless functions for API endpoints
- **NextAuth 4.24.11**: Authentication library with JWT strategy
- **Prisma 6.16.3**: ORM for database management
- **PostgreSQL**: Primary database (configured via DATABASE_URL)
- **bcryptjs 3.0.2**: Password hashing utility

### Development Tools
- **Turbopack**: Next.js bundler for fast development builds
- **ESLint**: Code linting with Next.js configuration

## Project Structure

```
lore-tracker-react/
├── app/                          # Next.js App Router
│   ├── api/                      # API Routes
│   │   └── auth/
│   │       ├── signup/
│   │       │   └── route.ts      # User registration endpoint
│   │       └── [...nextauth]/
│   │           └── route.ts      # NextAuth configuration
│   ├── auth/                     # Authentication pages
│   │   ├── signin/
│   │   │   └── page.tsx          # Sign-in page
│   │   └── signup/
│   │       └── page.tsx          # Sign-up page
│   ├── components/               # Reusable React components
│   │   ├── ArticleContent.tsx    # Renders article paragraphs with entity links
│   │   ├── ArticleHeader.tsx     # Chapter metadata display
│   │   ├── Breadcrumb.tsx        # Navigation breadcrumbs
│   │   ├── CustomFieldsPanel.tsx # Entity custom fields sidebar
│   │   ├── DateBadge.tsx         # Date display component
│   │   ├── EntityCard.tsx        # Entity info with book/chapter hierarchy
│   │   ├── EntityHeader.tsx      # Entity page header
│   │   ├── EntityLink.tsx        # Inline clickable entity references
│   │   ├── MomentCard.tsx        # Timeline moment display
│   │   ├── MomentsList.tsx       # Grouped moments by book/chapter
│   │   ├── NewEntityModal.tsx    # Global entity creation modal
│   │   ├── RelationshipsPanel.tsx # Entity relationships sidebar
│   │   ├── SessionProvider.tsx   # NextAuth session provider wrapper
│   │   └── Sidebar.tsx           # Main navigation sidebar
│   ├── dashboard/
│   │   └── page.tsx              # Universe overview dashboard
│   ├── entity/
│   │   └── page.tsx              # Entity detail view
│   ├── timeline/
│   │   └── page.tsx              # Timeline view with infinite scroll
│   ├── write/
│   │   └── page.tsx              # Writing/reading interface
│   ├── layout.tsx                # Root layout with font config
│   ├── globals.css               # Design system tokens
│   └── page.tsx                  # Home page (redirects to /dashboard)
├── lib/                          # Shared utilities
│   ├── auth.ts                   # Password hashing utilities
│   └── prisma.ts                 # Prisma client singleton
├── prisma/
│   └── schema.prisma             # Database schema definition
├── types/
│   └── next-auth.d.ts            # NextAuth TypeScript extensions
├── middleware.ts                 # NextAuth middleware for route protection
├── CLAUDE.md                     # Development instructions for AI assistants
└── package.json                  # Dependencies and scripts
```

## Application Architecture

### Page Structure

The application consists of 5 main pages:

1. **Home (`/`)**: Auto-redirects to `/dashboard`
2. **Dashboard (`/dashboard`)**: Universe overview with stats, writing progress, quick access, and recent activity
3. **Write (`/write`)**: Main writing/reading interface with article content and entity sidebar
4. **Entity (`/entity`)**: Detailed entity view with description, moments list, custom fields, and relationships
5. **Timeline (`/timeline`)**: Timeline view with infinite scrolling moments organized by book/chapter

### Authentication Pages

- **Sign In (`/auth/signin`)**: Email/password authentication
- **Sign Up (`/auth/signup`)**: User registration with validation

### Component Architecture

#### Layout Components
- **Sidebar**: Collapsible navigation with universe info, main navigation, entity links, and utility buttons
- **Breadcrumb**: Hierarchical navigation breadcrumbs

#### Entity Components
- **NewEntityModal**: Global modal for entity creation (managed at page level)
- **EntityCard**: Displays entity info with collapsible book/chapter hierarchy
- **EntityHeader**: Entity page header with name, stats, and metadata
- **EntityLink**: Clickable inline entity references in content

#### Content Components
- **ArticleHeader**: Chapter/article metadata with expand/collapse toggle
- **ArticleContent**: Renders paragraphs with embedded entity links
- **MomentCard**: Timeline moment with expandable content
- **MomentsList**: Grouped list of moments by book/chapter

#### Panel Components
- **CustomFieldsPanel**: Displays entity custom fields in sidebar
- **RelationshipsPanel**: Shows entity relationships in sidebar

### State Management Pattern

- **Page-level state**: React `useState` hooks manage local state
- **Modal state**: Managed at page level, passed down via props
- **Sidebar state**: Each page manages its own `sidebarOpen` state for mobile responsiveness
- **Session state**: NextAuth `SessionProvider` wraps entire application in root layout

### Routing & Middleware

- **Next.js App Router**: File-based routing system
- **Protected Routes**: NextAuth middleware protects all routes except:
  - `/api/auth/*` (authentication endpoints)
  - `/auth/signin` (sign-in page)
  - `/auth/signup` (sign-up page)
  - Static assets and favicon

## Design System

### Color Tokens (Tailwind Classes)

Defined in `app/globals.css`:

| Token | Hex | Usage | Tailwind Class |
|-------|-----|-------|----------------|
| Background | #101014 | Main dark background | `bg-background`, `text-background` |
| Card | #17171C | Component backgrounds | `bg-card`, `border-card` |
| Card on Card | #202027 | Nested card backgrounds | `bg-card-on-card`, `border-card-on-card` |
| Foreground | #292932 | Tertiary backgrounds | `bg-foreground` |
| Light Text | #ABABBA | Secondary text | `text-light-text` |
| White Text | #FFFFFF | Primary text | `text-white-text` |
| Accent | #6F6CED | Brand color, primary actions | `bg-accent`, `text-accent` |
| Accent 20% | rgba(111, 108, 237, 0.2) | Accent with opacity | `bg-accent/20` |

### Typography

- **Font Family**: Lexend (Google Fonts)
- **Font Variable**: `--font-lexend`
- **Applied globally** via `app/layout.tsx`

### UI/UX Patterns

#### Interactive Elements
- Hover states on all clickable elements with `transition-colors`
- Accent color (#6F6CED) for primary actions
- Smooth transitions using Tailwind utilities
- Consistent padding and spacing

#### Modals & Overlays
- Backdrop: `fixed inset-0 bg-black/60 z-50`
- Click outside to close
- Proper z-index layering
- Event propagation prevented on modal content

#### Responsive Design
- Mobile-first approach
- Breakpoints: `sm` (640px), `lg` (1024px)
- Collapsible sidebar for mobile (< lg breakpoint)
- Grid layouts stack on mobile

#### Data Display
- Cards use `bg-card` with `border-card-on-card` borders
- Nested cards use `bg-card-on-card` background
- Stats with large numbers and small labels
- Progress bars for completion tracking
- Infinite scroll for long lists (Timeline page)

## Integration Points

### Authentication Flow

1. **Sign Up**: `POST /api/auth/signup` → Validates input → Hashes password → Creates user in DB
2. **Sign In**: NextAuth Credentials Provider → Validates credentials → Issues JWT token
3. **Session Management**: JWT strategy with session callbacks extending user info
4. **Route Protection**: Middleware checks session for all protected routes

### Database Access

- **Prisma Client**: Singleton pattern in `lib/prisma.ts` prevents multiple instances
- **Connection Pooling**: Handled by Prisma
- **Type Safety**: Generated types from schema

## Development Workflow

### Commands

```bash
npm run dev      # Start development server with Turbopack
npm run build    # Build for production with Turbopack
npm start        # Start production server
npm run lint     # Run ESLint
```

### Environment Variables

Required in `.env`:

```
DATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="..."
NEXTAUTH_URL="http://localhost:3000"
```

## Current Implementation Status

### ✅ Completed
- Authentication system (sign up, sign in, session management)
- Full UI/UX for all main pages
- Design system with Tailwind CSS v4
- Component architecture
- Responsive layouts
- Route protection middleware

### 🚧 In Progress / TODO
- Database schema for lore entities (books, chapters, characters, locations, etc.)
- API routes for CRUD operations
- Replace mock data with real database queries
- Entity creation functionality
- Timeline data integration
- Search functionality
- Graph view implementation

## Key Technical Decisions

### Why NextAuth with JWT Strategy?
- **Scalability**: Stateless authentication without database lookups for every request
- **Performance**: Faster than database sessions
- **Simplicity**: No session table management required for basic auth

### Why Prisma?
- **Type Safety**: Auto-generated TypeScript types
- **Developer Experience**: Intuitive schema and query syntax
- **Migrations**: Built-in migration system
- **Multi-database Support**: Easy to switch databases if needed

### Why Turbopack?
- **Development Speed**: 700x faster than Webpack for incremental builds
- **Default in Next.js 15**: Official bundler for Next.js
- **Better DX**: Faster hot module replacement

### Why Tailwind CSS v4?
- **Performance**: New engine with better performance
- **Inline Theme**: No separate config file needed
- **Modern Features**: Better CSS variable support
- **Smaller Bundle**: Optimized output

## Notes for Future Development

1. **Database Schema Expansion**: Next step is to design and implement the full lore entity schema
2. **API Layer**: Create RESTful or tRPC endpoints for entity CRUD operations
3. **Real-time Features**: Consider WebSockets for collaborative editing
4. **Search Implementation**: Full-text search for entities and content
5. **File Uploads**: Image uploads for characters, locations, etc.
6. **Export Features**: Export universe data to various formats (JSON, PDF, etc.)
