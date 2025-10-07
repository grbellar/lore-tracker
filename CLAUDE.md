# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A lore tracker application for managing narrative content (books, chapters, characters, locations, etc.) built with Next.js 15, React 19, TypeScript, and Tailwind CSS v4.

## Development Commands

```bash
# Start development server with Turbopack
npm run dev

# Build for production with Turbopack
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

Development server runs at http://localhost:3000

## Architecture

### Component Structure

The app follows a component-based architecture with reusable UI components:

- **Sidebar** (`app/components/Sidebar.tsx`): Main navigation with icon-based menu. Takes `onAddEntity` callback to open the entity modal from anywhere in the app.
- **NewEntityModal** (`app/components/NewEntityModal.tsx`): Global modal for creating entities. Managed at the page level and can be triggered from any page via the sidebar.
- **ArticleHeader**: Displays chapter/article metadata (title, last updated, character count, word count, read time)
- **ArticleContent**: Renders paragraphs with embedded entity links
- **EntityLink**: Clickable entity references that appear inline in content
- **Breadcrumb**: Navigation breadcrumbs for book/chapter hierarchy

### State Management Pattern

Modal state is managed at the page level and passed down via props. The `NewEntityModal` is rendered in the page component and controlled by the `entityModalOpen` state, which is toggled by the sidebar's plus button via the `onAddEntity` callback.

### Styling System

Uses Tailwind CSS v4 with a custom design system defined in `app/globals.css`:

**Color Tokens** (use these Tailwind classes):
- `bg-background` / `text-background`: Main dark background (#101014)
- `bg-card` / `border-card`: Component backgrounds (#17171C)
- `bg-card-on-card`: Nested card backgrounds (#202027)
- `bg-foreground`: Tertiary backgrounds (#292932)
- `text-light-text`: Secondary text (#ABABBA)
- `text-white-text`: Primary text (#FFFFFF)
- `bg-accent` / `text-accent`: Brand color (#6F6CED)

**Typography**:
- Font: Lexend (loaded via next/font/google)
- Font variable: `--font-lexend`

### Tech Stack Details

- **Next.js 15.5.4**: App Router, Server Components, Turbopack for fast builds
- **React 19.1.0**: Latest React with concurrent features
- **TypeScript 5**: Strict mode enabled
- **Tailwind CSS v4**: Using `@tailwindcss/postcss` with inline theme config
- **Lucide React**: Icon library for UI icons

### File Organization

```
app/
├── components/       # Reusable UI components
├── page.tsx         # Home page with article reader
├── layout.tsx       # Root layout with font configuration
└── globals.css      # Design system tokens and theme
```

### Component Patterns

All components use:
- `'use client'` directive for client-side interactivity
- TypeScript interfaces for props
- Tailwind utility classes (no custom CSS)
- Lucide icons for iconography

When creating new modals or overlays, follow the pattern in `NewEntityModal.tsx`:
- Backdrop with `fixed inset-0 bg-black/60 z-50`
- Click outside to close
- Proper z-index layering
- Prevent event propagation on modal content
