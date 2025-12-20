# T‑Letter — MS Word‑like Editor (React + Tiptap + MUI)

T‑Letter is a Word‑style rich text editor built with React, TypeScript, and Tiptap. It provides basic formatting, multi‑page pagination, page breaks, headers/footers, auto page numbers, a TOC sidebar, bubble menu, keyboard shortcuts, and Redux‑backed state management.

## Overview
- Rich text editing with Tiptap (`@tiptap/react` + `StarterKit`)
- Material UI for toolbar, layout, and icons
- Pagination with real “page” nodes and overflow/underflow handling
- Page breaks, auto page numbering, header/footer simulation
- Sidebar navigation for headings
- Bubble menu on text selection
- Clipboard actions (Cut/Copy/Paste)
- Redux Toolkit for editor content and headings
- 20+ Google Fonts integrated via `index.html`

## Tech Stack
- React + TypeScript + Vite
- Tiptap 3 (`@tiptap/react`, `StarterKit`, `Underline`, `TextAlign`, `Placeholder`, `TextStyle`, `Color`, `Highlight`, `FontFamily`)
- Material UI (`@mui/material`, `@mui/icons-material`)
- Redux Toolkit (`@reduxjs/toolkit`, `react-redux`)
- Tailwind (optional, typography base) with Vite plugin

## Features
- Formatting: Bold, Italic, Underline, Strikethrough, Text Color, Highlight
- Typography: Font Family (20+ fonts), Heading levels (H1–H3)
- Layout: Text Align (left, center, right, justify), Lists (bulleted/numbered)
- Pagination:
  - Page nodes that represent A4 pages
  - Page breaks that split content onto new pages
  - Auto page numbering decoration
  - Overflow: split long paragraphs across pages
  - Underflow: pull content up when previous page has space
  - Remove empty pages automatically
- UI:
  - Toolbar with formatting controls
  - Bubble menu for selection formatting
  - Sidebar TOC with heading navigation
  - Clipboard buttons: Cut, Copy, Paste
- State:
  - Redux stores editor HTML and a parsed list of headings (with their positions)

## Architecture
- Editor root
  - `src/pages/Home.tsx`: Initializes the Tiptap editor, wires up extensions, calls `autoPaginate` on updates, and updates Redux with content and headings.
  - `src/components/Editor/Editor.tsx`: Renders `EditorContent`, toolbar, and styles.
  - `src/components/Editor/Toolbar.tsx`: Material UI toolbar with formatting, lists, alignments, fonts, and page break.
  - `src/components/Layout/Sidebar.tsx`: TOC navigation; clicking a heading moves the cursor and scrolls to that position.
- Pagination
  - `src/components/Editor/extensions/Page.ts`: Custom “page” block node rendered as `div.a4-page`, with a Backspace shortcut at the start of the page to move the first block up.
  - `src/components/Editor/extensions/PageBreak.tsx`: Page break block rendered as a divider line.
  - `src/components/Editor/extensions/PageNumberDecoration.ts`: Decoration plugin for auto page numbers.
  - `src/components/Editor/extensions/Paragraph.ts`: Renders paragraphs as `span.pm-paragraph` (styled as block) to support the pagination approach.
  - `src/components/Editor/extensions/splitParagraph.ts`: Finds the optimal split offset for overflowing paragraphs using range metrics and a binary search.
  - `src/components/Editor/extensions/splitParagraphCommand.ts`: Applies the split by replacing the original paragraph and placing overflow on the next page.
  - `src/components/Editor/pagination.ts`: Main orchestrator (overflow resolve, underflow fill, empty page cleanup, focus management).
- Styles
  - `src/components/Editor/EditorStyles.css`: Editor typography, page break visuals, and `.pm-paragraph` block behavior.
  - `src/components/Editor/extensions/pageNode.css`: Page node dimensions, header/footer positions.
- State
  - `src/store/editorSlice.ts`: Stores editor content, headings with positions, and page count.
  - `src/store/store.ts`: Redux store setup.

## Project Structure
```
src/
  components/
    Editor/
      extensions/
        Page.ts
        PageBreak.tsx
        PageNumberDecoration.ts
        Paragraph.ts
        pageNode.css
        splitParagraph.ts
        splitParagraphCommand.ts
      Editor.tsx
      EditorStyles.css
      Toolbar.tsx
      pagination.ts
    Layout/
      Header.tsx
      Sidebar.tsx
  pages/
    Home.tsx
  store/
    editorSlice.ts
    store.ts
  App.tsx
  main.tsx
index.html
```

## Getting Started
- Install dependencies: `npm install`
- Start dev server: `npm run dev`
- Build: `npm run build`
- Lint: `npm run lint`
- Preview build: `npm run preview`

## Fonts
- `index.html` links to multiple Google Fonts (Lato, Lora, Merriweather, Montserrat, Nunito, Open Sans, Oswald, Playfair Display, Poppins, Raleway, Roboto, Source Sans Pro, Ubuntu, and more).
- The toolbar font family control applies the selected font via the `FontFamily` extension.

## Keyboard Shortcuts
- Undo/Redo: `Ctrl+Z` / `Ctrl+Y`
- Backspace at start of page: moves first block up to previous page (if there is space), and removes now-empty pages safely.

## Pagination Notes
- Overflow detection uses DOM measurements relative to each page’s top; long paragraphs are split with a binary search to the largest fitting offset.
- Underflow fill brings content up from next page if it fits.
- Empty pages are removed from the end backwards, preserving at least one page.
- Selection is restored around moved/split content to keep the caret visible and focused.

## Navigation Sidebar
- Headings are parsed on update and stored in Redux with their document positions.
- Clicking a heading moves the cursor (`setTextSelection`) and scrolls the editor to that position.

## License
- For internal/demo use. Adapt as needed for production.
