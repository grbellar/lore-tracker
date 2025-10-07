# Entity View Page Implementation

**Related docs:**
- [Project Architecture](../System/project_architecture.md)
- [Database Schema](../System/database_schema.md)

**Status:** ✅ Completed
**Created:** 2025-10-07
**Type:** Feature Implementation

## Overview

Create a unified entity listing page that displays all entity types (Characters, Locations, Items, Organizations) in a reusable view. The page will feature grid/list view toggle, filtering by entity type, and navigation to individual entity detail pages. This consolidates entity browsing into a single, consistent interface.

## Requirements

### Core Requirements
- Reusable entity listing page for all entity types
- Grid view and list view toggle
- Filter by entity type (All, Characters, Locations, Items, Organizations)
- Search functionality (UI with mock data)
- Click entity card to navigate to detail view
- Responsive design matching existing components
- Use existing color theme and design system

### User Stories
- As a user, I can view all entities in one place
- As a user, I can switch between grid and list views
- As a user, I can filter entities by type
- As a user, I can search for specific entities
- As a user, I can click an entity to view its details
- As a user, I can navigate from the sidebar to the entity listing page
- As a user, I can return to the entity list from a detail page

## Design Specifications

### Color Theme (from globals.css)
- Background: `bg-background` (#101014)
- Card: `bg-card` (#17171C)
- Card on Card: `bg-card-on-card` (#202027)
- Foreground: `bg-foreground` (#292932)
- Light Text: `text-light-text` (#ABABBA)
- White Text: `text-white-text` (#FFFFFF)
- Accent: `bg-accent` / `text-accent` (#6F6CED)

### Layout Patterns

#### Grid View
- Responsive grid: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`
- Gap: `gap-6`
- Cards with auto height
- Entity type badge at top
- Truncated description (2-3 lines)
- Stats at bottom (moments count, last updated)

#### List View
- Single column: `grid-cols-1`
- Horizontal card layout
- Icon/badge on left
- Content in middle (name, type, description)
- Stats on right
- More description visible (4-5 lines)

### Entity Type Badges
- Character: `bg-blue-500/20 text-blue-400`
- Location: `bg-green-500/20 text-green-400`
- Item: `bg-orange-500/20 text-orange-400`
- Organization: `bg-purple-500/20 text-purple-400`

## Technical Implementation

### Files to Create

#### 1. `app/entities/page.tsx`
Main entity listing page component.

**Features:**
- Page header with title and description
- Search bar in header
- View toggle buttons (Grid/List)
- Filter dropdown (All, Characters, Locations, Items, Organizations)
- Responsive grid/list layout
- Mobile sidebar toggle
- Integration with NewEntityModal
- Mock data array of entities

**State Management:**
- `sidebarOpen` - Mobile sidebar state
- `entityModalOpen` - New entity modal state
- `viewMode` - 'grid' or 'list'
- `filterType` - 'all', 'character', 'location', 'item', 'organization'
- `searchQuery` - Search input value

**Mock Data Structure:**
```typescript
interface Entity {
  id: string;
  type: 'character' | 'location' | 'item' | 'organization';
  name: string;
  description: string;
  momentsCount: number;
  chaptersCount: number;
  booksCount: number;
  lastUpdated: string;
}
```

#### 2. `app/components/EntityListCard.tsx`
Reusable entity card component for list/grid display.

**Props:**
```typescript
interface EntityListCardProps {
  id: string;
  type: 'character' | 'location' | 'item' | 'organization';
  name: string;
  description: string;
  momentsCount: number;
  lastUpdated: string;
  viewMode: 'grid' | 'list';
  onClick: () => void;
}
```

**Features:**
- Conditional rendering based on viewMode
- Type badge with color coding
- Hover effect with accent border
- Truncated description
- Stats display
- Clickable card with transition

### Files to Modify

#### 3. `app/components/Sidebar.tsx` (Lines 19-24)
Update entity navigation links to point to filtered entity views:

```typescript
const entityItems = [
  { icon: Users, label: 'Characters', href: '/entities?type=character' },
  { icon: MapPin, label: 'Locations', href: '/entities?type=location' },
  { icon: Package, label: 'Items', href: '/entities?type=item' },
  { icon: Building2, label: 'Organizations', href: '/entities?type=organization' },
];
```

#### 4. `app/entity/page.tsx` (Lines 1-30)
Update to handle URL parameters and add back navigation:

**Changes:**
- Accept `searchParams` prop
- Read `id` and `type` from query params
- Update breadcrumb to use dynamic type from params
- Add back button to navigate to `/entities`
- Filter mock data based on entity ID

## Implementation Plan

### Phase 1: Component Creation ✅
1. ✅ Create task documentation
2. ✅ Create `EntityListCard` component
   - Grid view layout
   - List view layout
   - Type badge styling
   - Hover effects
3. ✅ Create `app/entities/page.tsx`
   - Page structure with header
   - Search and filter UI
   - View toggle buttons
   - Grid/list rendering

### Phase 2: Navigation Updates ✅
4. ✅ Update Sidebar entity links
5. ✅ Update entity detail page for URL params
6. ✅ Add back navigation to entity list

### Phase 3: Testing & Refinement ✅
7. ✅ Test responsive behavior
8. ✅ Test view switching
9. ✅ Test filtering and search
10. ✅ Test navigation flow
11. ✅ Update documentation

## Mock Data

### Sample Entities
```typescript
const mockEntities: Entity[] = [
  {
    id: '1',
    type: 'character',
    name: 'Luke Skywalker',
    description: 'Born on Tatooine, Luke Skywalker was a farm boy yearning for adventure among the stars. His life took a turn when he encountered Obi-Wan Kenobi.',
    momentsCount: 285,
    chaptersCount: 24,
    booksCount: 3,
    lastUpdated: 'March 14, 2024'
  },
  {
    id: '2',
    type: 'character',
    name: 'Leia Organa',
    description: 'Princess Leia Organa was a leader of the Rebel Alliance and a member of the Imperial Senate. She played a crucial role in the defeat of the Galactic Empire.',
    momentsCount: 198,
    chaptersCount: 18,
    booksCount: 3,
    lastUpdated: 'March 12, 2024'
  },
  {
    id: '3',
    type: 'location',
    name: 'Tatooine',
    description: 'A harsh desert world in the Outer Rim, home to moisture farmers, Jawas, and the infamous Mos Eisley spaceport.',
    momentsCount: 124,
    chaptersCount: 15,
    booksCount: 2,
    lastUpdated: 'March 10, 2024'
  },
  {
    id: '4',
    type: 'location',
    name: 'Death Star',
    description: 'A moon-sized battle station capable of destroying entire planets, symbol of the Empire\'s military might and technological prowess.',
    momentsCount: 89,
    chaptersCount: 12,
    booksCount: 1,
    lastUpdated: 'March 8, 2024'
  },
  {
    id: '5',
    type: 'item',
    name: 'Lightsaber',
    description: 'An elegant weapon for a more civilized age. The lightsaber is the signature weapon of the Jedi Order.',
    momentsCount: 156,
    chaptersCount: 20,
    booksCount: 3,
    lastUpdated: 'March 6, 2024'
  },
  {
    id: '6',
    type: 'organization',
    name: 'Rebel Alliance',
    description: 'A resistance movement formed to oppose the tyrannical Galactic Empire and restore freedom to the galaxy.',
    momentsCount: 234,
    chaptersCount: 22,
    booksCount: 3,
    lastUpdated: 'March 4, 2024'
  }
];
```

## UI Components & Interactions

### Header Section
- Title: "Entities" or filtered type name (e.g., "Characters")
- Description: Contextual based on filter
- Search bar (right side)
- Filter dropdown button
- View toggle (Grid/List icons)

### Filter Dropdown
- Options: All, Characters, Locations, Items, Organizations
- Icon for each type
- Active state with accent color
- Updates URL query params

### View Toggle
- Two icon buttons (Grid icon, List icon)
- Active button highlighted with accent
- Smooth transition between views

### Entity Cards
- Clickable with hover effect
- Border changes to accent on hover
- Smooth transitions
- Responsive sizing

## Routing & Navigation

### Routes
- `/entities` - All entities
- `/entities?type=character` - Characters only
- `/entities?type=location` - Locations only
- `/entities?type=item` - Items only
- `/entities?type=organization` - Organizations only

### Navigation Flow
1. User clicks "Characters" in sidebar → `/entities?type=character`
2. User clicks entity card → `/entity?id=1&type=character`
3. User clicks back button → `/entities?type=character`
4. User changes filter → URL updates with new type

## Success Criteria

- [x] Entity listing page displays all entities
- [x] Grid view shows responsive grid layout
- [x] List view shows single column layout
- [x] View toggle switches between grid/list
- [x] Filter dropdown filters entities by type
- [x] Search bar UI is functional (filtering in future)
- [x] Clicking entity navigates to detail page
- [x] Sidebar links point to entity listing page
- [x] Entity detail page accepts URL params
- [x] Back navigation returns to entity list
- [x] Responsive design works on mobile/tablet/desktop
- [x] All components use existing color theme
- [x] Hover effects and transitions work smoothly

## Future Enhancements

### Database Integration
- Replace mock data with Prisma queries
- Real-time entity counts
- Server-side filtering and search
- Pagination for large entity lists

### Advanced Features
- Sort options (name, date, moments count)
- Multi-select for bulk actions
- Export entity list
- Favorites/pinned entities
- Entity creation from list page
- Inline quick view modal

### Search Improvements
- Full-text search across all fields
- Search suggestions/autocomplete
- Search history
- Advanced filters (date range, book/chapter)

## Dependencies

### Existing Dependencies (No new installs needed)
- `next@15.5.4` - App Router
- `react@19.1.0` - UI framework
- `lucide-react@0.545.0` - Icons (Grid, List, Filter, Search, etc.)
- `tailwindcss@next` - Styling

### Required Icons
- `Grid` - Grid view button
- `List` - List view button
- `Filter` - Filter dropdown button
- `Search` - Search input
- `ChevronDown` - Filter dropdown arrow
- `ArrowLeft` - Back button
- `Users`, `MapPin`, `Package`, `Building2` - Entity type icons

## Notes

- All entity types use the same underlying data structure (unified entity system)
- Entity type is just a tag/category differentiator
- This page will be reused for all entity types
- Design matches existing dashboard and timeline pages
- Mobile-first responsive approach
- Consistent with app's dark theme and accent color

## References

- [Project Architecture](../System/project_architecture.md) - Component patterns
- [Dashboard Page](../../app/dashboard/page.tsx) - Header and layout reference
- [Timeline Page](../../app/timeline/page.tsx) - Filter and search patterns
- [Entity Detail Page](../../app/entity/page.tsx) - Data structure reference

---

**Last Updated:** 2025-10-07
**Task Owner:** Development Team
**Priority:** High
**Estimated Effort:** 3-4 hours
