# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Reifier is a CLI tool for comparing build artifacts between Git branches. It's designed for PR review workflows where you want to visually inspect compiled output differences (e.g., ReScript `.bs.js` files).

## Commands

```bash
# Build
npm run build          # tsup + copy templates to dist/

# Development
npm run dev            # tsup with watch mode

# Type checking
npm run typecheck      # tsc --noEmit

# Tests
npm run test           # vitest run (single run)
npm run test:watch     # vitest (watch mode)
```

## Architecture

### Core Flow

```
run() → capture(base) → capture(head) → diff()
```

1. **capture**: Switches to branch → runs build → collects files matching pattern → stores in orphan branch `reified` under `_artifacts/{branch}/`
2. **diff**: Compares `_artifacts/base` vs `_artifacts/head` using `diff -ruN` → renders HTML via diff2html

### Directory Structure

```
src/
├── cli.ts              # Commander-based CLI entry point
├── index.ts            # Library exports
├── commands/
│   ├── capture.ts      # Branch artifact capture logic
│   ├── diff.ts         # Diff generation
│   └── run.ts          # Full pipeline orchestration
├── lib/
│   ├── git.ts          # simple-git wrapper (branch switching, orphan management)
│   ├── build.ts        # Build command execution
│   └── renderer.ts     # diff2html HTML rendering via Mustache
└── templates/
    └── diff.mustache   # HTML template for diff output

renderer/               # Legacy/standalone Cloudflare Pages diff renderer
test/
└── e2e.test.ts         # E2E tests using temp git repos
```

### Key Constants

- Default build command: `yarn && yarn build`
- Default file pattern: `.*\.bs\.js` (ReScript output)
- Orphan branch for artifacts: `reified`
- Artifacts directory: `_artifacts/`

### Dependencies

- `simple-git`: Git operations
- `commander`: CLI parsing
- `mustache`: HTML template rendering
