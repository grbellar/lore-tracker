# Notion-Style Text Editor System

**Created:** 2025-10-07
**Status:** ✅ Implemented
**Related Documentation:**
- [Project Architecture](./project_architecture.md)
- [Notion-Style Editor PRD](../Tasks/notion_style_editor.md)

## Overview

The Lore Tracker writing interface features a Notion-style WYSIWYG text editor built with Tiptap, providing a clean, minimal, and distraction-free writing experience. The editor supports rich text formatting, slash commands for quick formatting, and entity mentions with @ symbol.

## Architecture

### Technology Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| **Tiptap** | 3.6.5 | Headless editor framework built on ProseMirror |
| **@tiptap/react** | 3.6.5 | React bindings for Tiptap |
| **@tiptap/starter-kit** | 3.6.5 | Essential editing extensions bundle |
| **@tiptap/extension-placeholder** | 3.6.5 | Placeholder text extension |
| **@tiptap/extension-character-count** | 3.6.5 | Character and word counting |
| **@tiptap/extension-mention** | 3.6.5 | Entity mention support with @ trigger |
| **@tiptap/suggestion** | 3.6.5 | Autocomplete suggestion engine |
| **tippy.js** | 6.3.7 | Tooltip and popover positioning |
| **@tippyjs/react** | 4.2.6 | React wrapper for tippy.js |

### Why Tiptap?

Tiptap was chosen for several key reasons:
- **Headless Architecture**: Complete control over UI/UX, no default styling to override
- **React Integration**: First-class React support with hooks
- **Extensibility**: Modular extension system for custom features
- **ProseMirror Foundation**: Built on battle-tested ProseMirror editor
- **JSON Content Format**: Stores content as structured JSON (database-friendly)
- **Active Community**: Well-maintained with extensive documentation
- **Notion-like Features**: Easy to implement slash commands and mentions

## Component Architecture

### 1. Editor Component (`app/components/Editor.tsx`)

**Purpose**: Main editor component that wraps Tiptap and provides the core editing interface.

**Key Features:**
- Initializes Tiptap editor with configured extensions
- Manages editor state and content
- Provides callbacks for content updates and metrics
- Handles styling and theming

**Props Interface:**
```typescript
interface EditorProps {
  content?: string;              // Initial HTML content
  onUpdate?: (content: string) => void;  // Called on content change
  onCharacterCountUpdate?: (count: number) => void;  // Real-time char count
  onWordCountUpdate?: (count: number) => void;       // Real-time word count
}
```

**Extensions Configured:**
- `StarterKit`: Basic editing features (headings 1-3, bold, italic, lists, etc.)
- `Placeholder`: Shows placeholder text when editor is empty
- `CharacterCount`: Tracks character and word counts
- `SlashCommands`: Custom slash menu for formatting
- `Mention`: Entity linking with @ symbol

**Content Output:**
- Outputs HTML format via `editor.getHTML()`
- Can be converted to JSON via `editor.getJSON()`
- Updates parent component on every keystroke

**Character/Word Counting:**
```typescript
// Access counts from editor storage
const characterCount = editor.storage.characterCount.characters();
const wordCount = editor.storage.characterCount.words();
```

**File Location:** `app/components/Editor.tsx:1-136`

---

### 2. Slash Menu Component (`app/components/SlashMenu.tsx`)

**Purpose**: Custom slash command menu for quick text formatting, triggered by typing `/`.

**Key Features:**
- Keyboard-navigable dropdown menu
- Filters commands by search query
- Styled to match Notion's aesthetic
- Arrow key navigation + Enter to select
- Escape to dismiss

**Available Commands:**

| Command | Description | Icon | Action |
|---------|-------------|------|--------|
| Heading 1 | Large section heading | H1 | Converts to `<h1>` |
| Heading 2 | Medium section heading | H2 | Converts to `<h2>` |
| Heading 3 | Small section heading | H3 | Converts to `<h3>` |
| Bullet List | Create a bullet list | • | Toggles bullet list |
| Numbered List | Create a numbered list | 1. | Toggles ordered list |
| Quote | Create a blockquote | ❝ | Toggles blockquote |
| Code Block | Create a code block | <> | Toggles code block |

**Implementation Details:**
- Built as a Tiptap Extension using the Suggestion API
- Renders as a React component via `ReactRenderer`
- Positioned using tippy.js for smart placement
- Filters in real-time as user types query

**Keyboard Navigation:**
- `Arrow Up/Down`: Navigate items
- `Enter`: Execute selected command
- `Escape`: Close menu

**File Location:** `app/components/SlashMenu.tsx:1-247`

---

### 3. Entity Mention System

The entity mention system consists of two components working together:

#### 3a. MentionExtension (`app/components/MentionExtension.tsx`)

**Purpose**: Configures and creates the Tiptap Mention extension for entity linking.

**Key Features:**
- Triggered by typing `@` symbol
- Searches through available entities
- Limits results to top 5 matches
- Currently uses hardcoded mock data

**Mock Entities (Temporary):**
```typescript
const MOCK_ENTITIES: MentionItem[] = [
  { id: '1', name: 'Luke Skywalker', type: 'character' },
  { id: '2', name: 'C-3PO', type: 'character' },
  { id: '3', name: 'Mark Janzen', type: 'character' },
  { id: '4', name: 'Millennium Falcon', type: 'location' },
  { id: '5', name: 'Jakku', type: 'location' },
  { id: '6', name: 'Tatooine', type: 'location' },
  { id: '7', name: 'Lightsaber', type: 'item' },
  { id: '8', name: 'Planetary Talent Inc.', type: 'organization' },
];
```

**Future Enhancement:**
Replace `MOCK_ENTITIES` with API call to fetch real entities from database.

**File Location:** `app/components/MentionExtension.tsx:1-87`

#### 3b. MentionList (`app/components/MentionList.tsx`)

**Purpose**: Renders the autocomplete dropdown for entity mentions.

**Key Features:**
- Displays entity name, type, and appropriate icon
- Type-specific icons (User, MapPin, Package, Building2)
- Keyboard navigation support
- Visual feedback for selected item

**Entity Types Supported:**
- `character`: User icon
- `location`: MapPin icon
- `item`: Package icon
- `organization`: Building2 icon

**Interface:**
```typescript
interface MentionItem {
  id: string;
  name: string;
  type: 'character' | 'location' | 'item' | 'organization';
}
```

**File Location:** `app/components/MentionList.tsx:1-118`

---

## Integration with Write Page

The editor is integrated into the `/write` route (`app/write/page.tsx`) as follows:

### State Management

```typescript
const [editorContent, setEditorContent] = useState('');
const [characterCount, setCharacterCount] = useState(0);
const [wordCount, setWordCount] = useState(0);
```

### Editor Usage

```tsx
<Editor
  content={editorContent}
  onUpdate={setEditorContent}
  onCharacterCountUpdate={setCharacterCount}
  onWordCountUpdate={setWordCount}
/>
```

### Character/Word Count Display

The counts are passed to `ArticleHeader` for real-time display:

```tsx
<ArticleHeader
  title={articleData.title}
  lastUpdated={articleData.lastUpdated}
  characterCount={characterCount}
  wordCount={wordCount}
  readTime={articleData.readTime}
  onExpand={() => setIsExpanded(!isExpanded)}
/>
```

### Layout Behavior

- **Two-column layout**: Editor on left (2/3 width), EntityCard on right (1/3 width)
- **Expand mode**: Editor expands to centered single column, hides EntityCard
- **Responsive**: Stacks vertically on mobile, side-by-side on desktop

**File Location:** `app/write/page.tsx:1-145`

---

## Design System Integration

The editor seamlessly integrates with the existing dark theme design system:

### Color Palette

| Element | Color | CSS Class |
|---------|-------|-----------|
| Background | #101014 | `bg-background` |
| Text (body) | #ABABBA | `text-light-text` |
| Text (headings) | #FFFFFF | `text-white-text` |
| Accent | Teal/Cyan | `text-accent` |
| Card background | #17171C | `bg-card` |
| Card borders | #202027 | `border-card-on-card` |

### Typography

- **Font family**: Lexend (project-wide font)
- **Base size**: `text-base` (16px) on mobile, `text-lg` (18px) on desktop
- **Line height**: `leading-relaxed` (1.625)
- **Headings**: Bold weight, white color for emphasis

### Styling Classes

The editor uses Tailwind utility classes applied via custom selectors:

```css
[&_.ProseMirror_p]:mb-6
[&_.ProseMirror_p]:leading-relaxed
[&_.ProseMirror_h1]:text-3xl
[&_.ProseMirror_h1]:font-bold
[&_.ProseMirror_h1]:text-white-text
```

### Placeholder Styling

```css
[&_.ProseMirror_.is-editor-empty:first-child::before]:text-light-text/40
[&_.ProseMirror_.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]
```

Displays: `"Write, press 'space' for AI, '/' for commands..."`

### Entity Mention Styling

```css
[&_.ProseMirror_.mention]:bg-accent/20
[&_.ProseMirror_.mention]:text-accent
[&_.ProseMirror_.mention]:px-1
[&_.ProseMirror_.mention]:rounded
```

Matches existing `EntityLink` component style.

---

## Data Flow

### 1. User Types Content

```
User types → Editor updates → onUpdate callback → Parent state updated
                ↓
         Character/Word count updates
                ↓
         onCharacterCountUpdate / onWordCountUpdate callbacks
                ↓
         ArticleHeader displays counts
```

### 2. Slash Commands

```
User types "/" → SlashCommands extension activates
                ↓
         CommandList renders with tippy.js
                ↓
         User selects command (arrow keys + Enter or click)
                ↓
         Command executes (e.g., setNode('heading', { level: 1 }))
                ↓
         Editor re-renders with formatted content
```

### 3. Entity Mentions

```
User types "@" → Mention extension activates
                ↓
         MentionList renders with entity suggestions
                ↓
         Filter entities by query as user types
                ↓
         User selects entity (arrow keys + Enter or click)
                ↓
         Mention node inserted with { id, label } attributes
                ↓
         Rendered as styled mention span
```

---

## Content Storage Format

### HTML Format (Current)

The editor currently outputs HTML via `editor.getHTML()`:

```html
<h1>Chapter Title</h1>
<p>This is a paragraph with <strong>bold text</strong> and a mention of <span class="mention" data-id="3">Mark Janzen</span>.</p>
<ul>
  <li>Bullet point 1</li>
  <li>Bullet point 2</li>
</ul>
```

### JSON Format (Available)

Tiptap can also output structured JSON via `editor.getJSON()`:

```json
{
  "type": "doc",
  "content": [
    {
      "type": "heading",
      "attrs": { "level": 1 },
      "content": [{ "type": "text", "text": "Chapter Title" }]
    },
    {
      "type": "paragraph",
      "content": [
        { "type": "text", "text": "This is a paragraph with " },
        { "type": "text", "text": "bold text", "marks": [{ "type": "bold" }] },
        { "type": "text", "text": " and a mention of " },
        {
          "type": "mention",
          "attrs": { "id": "3", "label": "Mark Janzen" }
        },
        { "type": "text", "text": "." }
      ]
    },
    {
      "type": "bulletList",
      "content": [
        {
          "type": "listItem",
          "content": [
            {
              "type": "paragraph",
              "content": [{ "type": "text", "text": "Bullet point 1" }]
            }
          ]
        },
        {
          "type": "listItem",
          "content": [
            {
              "type": "paragraph",
              "content": [{ "type": "text", "text": "Bullet point 2" }]
            }
          ]
        }
      ]
    }
  ]
}
```

**Recommendation:** For future database storage, use JSON format stored in a Prisma `Json` field for better queryability and manipulation.

---

## Performance Considerations

### Editor Initialization

- `immediatelyRender: false` prevents hydration issues with SSR
- Editor only renders on client-side (component marked `'use client'`)

### Update Throttling

Currently, `onUpdate` fires on every keystroke. For production, consider:
- Debouncing the `onUpdate` callback
- Auto-save with debounced API calls (e.g., save every 2 seconds of inactivity)

### Large Documents

Tiptap handles large documents well, but consider:
- Lazy loading entity suggestions (paginate API results)
- Virtualizing slash command list if it grows large
- Implementing document chunking for very large content

---

## Security Considerations

### XSS Prevention

- Tiptap sanitizes content by default
- HTML output is safe to render
- Entity mentions are stored as structured data (id + label), not raw HTML

### Input Validation

When saving to database:
- Validate JSON structure matches expected schema
- Sanitize entity IDs before querying database
- Rate limit save operations

---

## Future Enhancements

### 1. AI Integration (Placeholder in UI)

The placeholder mentions `"press 'space' for AI"` - planned feature:
- Space bar triggers AI autocomplete
- Suggest next sentence/paragraph
- Content generation based on context
- Writing style suggestions

### 2. Database Integration

Replace mock entities with real API:

```typescript
// Replace in MentionExtension.tsx
const fetchEntities = async (query: string) => {
  const response = await fetch(`/api/entities/search?q=${query}`);
  return response.json();
};
```

### 3. Auto-Save

Implement periodic content saving:

```typescript
useEffect(() => {
  const timeout = setTimeout(() => {
    saveContent(editorContent);
  }, 2000);
  return () => clearTimeout(timeout);
}, [editorContent]);
```

### 4. Collaborative Editing

Tiptap supports collaborative editing via:
- **Y.js** for CRDT-based collaboration
- Real-time cursor presence
- User avatars and selections

### 5. Advanced Formatting

Add more extensions:
- Tables (`@tiptap/extension-table`)
- Images with drag-drop (`@tiptap/extension-image`)
- Syntax-highlighted code blocks (`@tiptap/extension-code-block-lowlight`)
- Callouts/alerts (custom extension)
- Embeds (custom extension)

### 6. Version History

Track changes over time:
- Store snapshots in database with timestamps
- Diff viewer to compare versions
- Restore previous versions

### 7. Export Functionality

Export content in multiple formats:
- Markdown (via `@tiptap/extension-markdown`)
- PDF (client-side rendering)
- Plain text
- DOCX (third-party library)

---

## Keyboard Shortcuts

### Default (StarterKit)

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + B` | Bold |
| `Ctrl/Cmd + I` | Italic |
| `Ctrl/Cmd + Z` | Undo |
| `Ctrl/Cmd + Shift + Z` | Redo |
| `Ctrl/Cmd + Shift + X` | Strikethrough |
| `Ctrl/Cmd + Shift + C` | Code |

### Custom Triggers

| Trigger | Action |
|---------|--------|
| `/` | Open slash command menu |
| `@` | Open entity mention menu |
| `Space` (planned) | Trigger AI autocomplete |

---

## Troubleshooting

### Common Issues

**Issue**: Editor not rendering on page load
**Solution**: Ensure component is marked `'use client'` and `immediatelyRender: false` is set

**Issue**: Tippy popups not positioned correctly
**Solution**: Check that `tippy.js` CSS is imported (`import 'tippy.js/dist/tippy.css'`)

**Issue**: Mentions not clickable
**Solution**: Add click handler to mention node renderer (not yet implemented)

**Issue**: Character count not updating
**Solution**: Verify callbacks are wired correctly from Editor → Page → ArticleHeader

**Issue**: Slash menu not filtering
**Solution**: Check query parameter is being passed to items filter function

---

## Testing Checklist

- [x] Editor renders and accepts input
- [x] Placeholder text displays correctly
- [x] Slash menu appears on `/` key
- [x] Slash commands work (headings, lists, etc.)
- [x] Character/word count updates in real-time
- [x] @ mentions trigger entity search
- [x] Entity mentions filter by query
- [ ] Entity mentions are clickable (not yet implemented)
- [ ] Editor content persists to database (not yet implemented)
- [x] Expand/collapse mode works with editor
- [x] Mobile responsive
- [x] Keyboard shortcuts work
- [x] Focus states are visible

---

## Code Examples

### Initializing the Editor

```tsx
import Editor from '@/app/components/Editor';

function MyPage() {
  const [content, setContent] = useState('');
  const [charCount, setCharCount] = useState(0);
  const [wordCount, setWordCount] = useState(0);

  return (
    <Editor
      content={content}
      onUpdate={setContent}
      onCharacterCountUpdate={setCharCount}
      onWordCountUpdate={setWordCount}
    />
  );
}
```

### Adding a Custom Slash Command

```typescript
// In SlashMenu.tsx, add to commands array:
{
  title: 'Divider',
  description: 'Add a horizontal rule',
  icon: '—',
  command: ({ editor, range }) => {
    editor.chain().focus().deleteRange(range).setHorizontalRule().run();
  },
}
```

### Adding a New Entity Type

```typescript
// In MentionList.tsx, add to getEntityIcon():
case 'event':
  return <Calendar className={iconClass} />;

// In MentionExtension.tsx, update type:
type: 'character' | 'location' | 'item' | 'organization' | 'event';
```

---

## API Endpoints (Future)

### Save Content

```typescript
POST /api/chapters/[id]/content
Body: {
  content: string; // HTML or JSON
  format: 'html' | 'json';
}
```

### Search Entities

```typescript
GET /api/entities/search?q=luke&limit=5
Response: MentionItem[]
```

### Auto-Save

```typescript
PATCH /api/chapters/[id]/autosave
Body: {
  content: string;
  timestamp: Date;
}
```

---

## References

- [Tiptap Documentation](https://tiptap.dev/)
- [Tiptap Examples](https://tiptap.dev/examples)
- [ProseMirror Guide](https://prosemirror.net/docs/guide/)
- [Tippy.js Documentation](https://atomiks.github.io/tippyjs/)
- [Tiptap Extension API](https://tiptap.dev/docs/editor/api/extensions)

---

**Last Updated:** 2025-10-07
**Implementation Status:** ✅ Core functionality complete, ready for backend integration
