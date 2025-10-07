# Notion-Style Text Editor Implementation

**Status:** 🚧 In Progress
**Created:** 2025-10-07
**Last Updated:** 2025-10-07

## Overview

Transform the `/write` route from a static content viewer to an interactive Notion-style text editor with a clean, minimal interface.

## Requirements

### User Story
As a writer, I want to be able to actually type and edit content in the `/write` route with a clean, Notion-style interface that feels minimal and distraction-free.

### Functional Requirements
1. Interactive text editor that allows typing and editing
2. Notion-style placeholder text ("Write, press 'space' for AI, '/' for commands...")
3. Slash menu (`/`) for formatting commands (headings, lists, etc.)
4. Automatic character and word counting
5. Support for markdown shortcuts
6. Minimal toolbar that appears on text selection
7. Entity linking with @ mentions
8. Clean, distraction-free interface

### Design Requirements
1. Match existing dark theme design system
2. Use Lexend font (current project font)
3. Blend seamlessly with current UI
4. Subtle focus states
5. Slash menu styled like Notion's aesthetic

## Technical Approach

### Technology Selection: Tiptap

**Why Tiptap?**
- Headless editor library - fully customizable
- Most popular Notion-like editor for React
- Extensive extension ecosystem
- Built on ProseMirror (robust foundation)
- Native JSON content format
- Easy to integrate entity mentions and custom features

### Dependencies Required

```json
{
  "@tiptap/react": "^2.x",
  "@tiptap/starter-kit": "^2.x",
  "@tiptap/extension-placeholder": "^2.x",
  "@tiptap/extension-character-count": "^2.x",
  "@tiptap/extension-mention": "^2.x"
}
```

## Implementation Plan

### Step 1: Install Dependencies
```bash
npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-placeholder @tiptap/extension-character-count @tiptap/extension-mention
```

### Step 2: Create Editor Component
**File:** `app/components/Editor.tsx`

Features:
- Initialize Tiptap editor with StarterKit
- Add placeholder extension
- Add character count extension
- Configure editor with dark theme styling
- Export editor content as JSON

### Step 3: Create Slash Menu Component
**File:** `app/components/SlashMenu.tsx`

Features:
- Custom slash command menu
- Commands for headings (H1, H2, H3)
- Commands for lists (bullet, numbered)
- Commands for formatting (bold, italic, code)
- Keyboard navigation
- Styled to match Notion

### Step 4: Update Write Page
**File:** `app/write/page.tsx`

Changes:
- Replace `ArticleContent` component with new `Editor` component
- Add state for editor content (JSON format)
- Maintain `ArticleHeader` for metadata
- Keep two-column layout (editor left, entity card right)
- Preserve expand/collapse functionality
- Wire up character/word count from editor to header

### Step 5: Add Entity Mention Support
**File:** `app/components/Editor.tsx`

Features:
- Configure @ mention extension
- Load entities for autocomplete
- Render entity mentions with `EntityLink` component
- Style mentions to match existing entity links

## File Structure

```
app/
├── components/
│   ├── Editor.tsx           # NEW: Main Tiptap editor component
│   ├── SlashMenu.tsx        # NEW: Slash command menu
│   ├── ArticleContent.tsx   # KEEP: For viewing mode
│   ├── ArticleHeader.tsx    # MODIFY: Wire up live counts
│   └── ...
├── write/
│   └── page.tsx             # MODIFY: Replace ArticleContent with Editor
```

## Data Model

### Editor Content Format
```typescript
// Tiptap stores content as JSON
interface EditorContent {
  type: 'doc';
  content: Array<{
    type: 'paragraph' | 'heading' | 'bulletList' | 'orderedList';
    content?: Array<{
      type: 'text' | 'mention';
      text?: string;
      marks?: Array<{ type: 'bold' | 'italic' | 'code' }>;
      attrs?: { id: string; label: string }; // for mentions
    }>;
  }>;
}
```

## Design Specifications

### Editor Styling
- Background: `bg-background` (#101014)
- Text color: `text-light-text` (#ABABBA)
- Focus: Subtle border with `border-accent/20`
- Padding: Generous padding for comfort
- Line height: `leading-relaxed`
- Font size: `text-base md:text-lg`

### Placeholder Styling
- Color: `text-light-text/40`
- Text: "Write something great... '/' for commands, '@' to tag entities...",


### Slash Menu Styling
- Background: `bg-card` (#17171C)
- Border: `border-card-on-card` (#202027)
- Hover: `bg-card-on-card`
- Selected: `bg-accent/20` with `text-accent`
- Shadow: Subtle shadow for depth

### Entity Mentions
- Use existing `EntityLink` component styling
- Background: `bg-accent/20`
- Text: `text-accent`
- Rounded: `rounded`
- Padding: `px-1`

## Integration Points

### Character/Word Count
- Editor provides real-time counts via `editor.storage.characterCount`
- Update `ArticleHeader` to receive live counts from editor
- Display: "X characters • Y words"

### Entity System
- @ mention triggers entity search
- Load entities from future API endpoint
- For now, use hardcoded entity list
- Clicking mention navigates to entity page

### Save Functionality
- Auto-save editor content to local state
- Future: API endpoint to save to database
- Store as JSON in database (Prisma JSON field)

## Future Enhancements

1. **AI Integration**
   - Space bar triggers AI autocomplete
   - AI writing assistance
   - Content suggestions

2. **Collaboration**
   - Real-time collaborative editing
   - Cursor presence
   - Comments and suggestions

3. **Advanced Formatting**
   - Tables
   - Images
   - Code blocks with syntax highlighting
   - Callouts/alerts

4. **Version History**
   - Track changes over time
   - Restore previous versions
   - Compare versions

## Testing Checklist

- [ ] Editor renders and accepts input
- [ ] Placeholder text displays correctly
- [ ] Slash menu appears on `/` key
- [ ] Slash commands work (headings, lists, etc.)
- [ ] Character/word count updates in real-time
- [ ] @ mentions trigger entity search
- [ ] Entity mentions are clickable
- [ ] Editor content persists in state
- [ ] Expand/collapse mode works with editor
- [ ] Mobile responsive
- [ ] Keyboard shortcuts work
- [ ] Focus states are visible

## Success Criteria

1. ✅ User can type and edit content in the `/write` route
2. ✅ Interface matches Notion's clean, minimal aesthetic
3. ✅ Slash menu provides formatting options
4. ✅ Character and word counts update live
5. ✅ Entity mentions work with @ symbol
6. ✅ Editor matches existing design system
7. ✅ No performance issues with large documents

## References

- [Tiptap Documentation](https://tiptap.dev/)
- [Tiptap Examples](https://tiptap.dev/examples)
- [ProseMirror Guide](https://prosemirror.net/docs/guide/)

---

**Implementation Date:** TBD
**Completed Date:** TBD
