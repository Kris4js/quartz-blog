# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Quartz v4 is a static site generator for publishing digital gardens and notes as websites. It features a plugin-based architecture with end-user extensibility.

**Requirements**: Node.js >= 22, npm >= 10.9.2

## Common Commands

### Development
```bash
# Build the site (outputs to 'public' folder)
npx quartz build

# Build with live preview and hot reload
npx quartz build --serve

# Build with watch mode (rebuild on changes)
npx quartz build --watch

# Build with verbose logging
npx quartz build --verbose

# Build with custom content directory
npx quartz build --directory <path>

# Build with custom output directory
npx quartz build --output <path>
```

### Testing and Quality
```bash
# Run tests
npm test

# Type checking
npx tsc --noEmit

# Format code
npm run format

# Check formatting without applying
npm run check
```

### CLI Commands
```bash
npx quartz create   # Initialize Quartz
npx quartz update   # Get latest Quartz updates
npx quartz restore  # Restore content folder from cache
npx quartz sync     # Sync with GitHub (commit, push, pull)
```

## Architecture

### Build Pipeline

The build process follows a three-stage pipeline:

1. **Parse**: Markdown files are parsed into MDAST (Markdown Abstract Syntax Tree) using `remark-parse`
2. **Transform**: Plugins transform the AST (markdown → markdown transforms, then markdown → HTML via `remark-rehype`)
3. **Emit**: Processed content is emitted as static HTML files

Key files:
- `quartz/build.ts` - Main build orchestration
- `quartz/processors/parse.ts` - Markdown parsing and processing
- `quartz/processors/filter.ts` - Content filtering
- `quartz/processors/emit.ts` - File emission

### Plugin System

Three types of plugins defined in `quartz/plugins/types.ts`:

**Transformers** (`quartz/plugins/transformers/`):
- Process markdown and HTML ASTs
- Add markdown plugins (`markdownPlugins`) or HTML plugins (`htmlPlugins`)
- Examples: syntax highlighting, LaTeX rendering, link processing, frontmatter extraction
- Can provide external resources (CSS, JS) via `externalResources()`

**Filters** (`quartz/plugins/filters/`):
- Determine which content should be published
- Implement `shouldPublish(ctx, content)` method
- Example: `RemoveDrafts` filters out draft content

**Emitters** (`quartz/plugins/emitters/`):
- Generate output files
- Implement `emit()` for full builds
- Optionally implement `partialEmit()` for incremental rebuilds
- Examples: `ContentPage`, `FolderPage`, `TagPage`, `RSS`, `Assets`

### Component System

UI components are Preact-based (`quartz/components/`):
- Components are composed in layouts defined in `quartz.layout.ts`
- Three layout areas: `left`, `right`, `beforeBody`
- Shared components apply to all pages (`head`, `header`, `footer`, `afterBody`)
- Components can be conditional using `ConditionalRender`
- Component types defined in `quartz/components/types.ts`

### Configuration

**`quartz.config.ts`**:
- Global configuration: site title, theme, analytics, locale, ignore patterns
- Plugin registration: transformers, filters, emitters
- Theme configuration: colors, fonts, typography

**`quartz.layout.ts`**:
- Component placement for different page types
- `defaultContentPageLayout`: single note pages
- `defaultListPageLayout`: tag/folder listing pages
- `sharedPageComponents`: common to all pages

### Path System

Quartz uses a sophisticated slug system (`quartz/util/path.ts`):
- **FullSlug**: canonical path (e.g., `folder/note`, `index`)
- **SimpleSlug**: simplified for display (e.g., `folder/`, `/`)
- **FilePath**: actual file system path (e.g., `content/note.md`)
- Link resolution strategies: `absolute`, `relative`, `shortest`

### Incremental Builds

When `--watch` mode is enabled:
- File changes tracked via chokidar watcher
- Incremental rebuilds only process changed files
- Emitters can implement `partialEmit()` for efficient updates
- Build mutex prevents concurrent builds

### Worker Pool

Multi-threaded parsing using `workerpool`:
- Markdown parsing parallelized across multiple workers
- Worker script: `quartz/bootstrap-worker.mjs`
- Configurable concurrency via `--concurrency` flag

## Development Patterns

### Creating a Transformer Plugin

```typescript
import { QuartzTransformerPlugin } from "../types"

export const MyPlugin: QuartzTransformerPlugin<Options> = (opts) => ({
  name: "MyPlugin",
  markdownPlugins: (ctx) => [/* remark plugins */],
  htmlPlugins: (ctx) => [/* rehype plugins */],
  externalResources: (ctx) => ({ css: [...], js: [...] }),
})
```

### Creating a Component

Components are Preact functional components:
```tsx
import { QuartzComponent, QuartzComponentProps } from "../types"

export default (() => {
  function MyComponent(props: QuartzComponentProps) {
    return <div>...</div>
  }
  MyComponent.css = "...style..."
  return MyComponent
}) satisfies QuartzComponent
```

### Testing

Tests use Node.js built-in test runner:
```typescript
import test, { describe } from "node:test"
import assert from "node:assert"
```

Run with: `npm test` (uses `tsx --test`)

## Key Concepts

**Single Page App (SPA) Mode**: Enabled via `enableSPA` in config. Uses micromorph for smooth transitions without full page reloads.

**Popovers**: Wikipedia-style link previews on hover. Enabled via `enablePopovers`.

**Hot Reload**: WebSocket-based live reload in serve mode. Default WS port: 3001.

**Ignore Patterns**: Glob patterns in config to exclude files from processing (e.g., `private`, `templates`, `.obsidian`).

**Date Types**: `created`, `modified`, or `published` dates. Set default via `defaultDateType`.

**Analytics**: Multiple providers supported (Plausible, Google, Umami, GoatCounter, etc.) configured in `analytics`.

**Theme System**: Configurable light/dark mode themes with custom colors and typography. Fonts from Google Fonts or custom origins.

## File Organization

- `content/` - Source markdown files (configurable)
- `public/` - Built output (configurable)
- `quartz/` - Core framework code
- `quartz/plugins/` - Plugin implementations
- `quartz/components/` - Preact UI components
- `quartz/util/` - Utility functions
- `docs/` - Documentation (can be built with `npm run docs`)
