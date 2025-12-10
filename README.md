# Babbage

<p align="center">
  <img src="assets/image.png" alt="Babbage" width="200">
</p>

A CLI tool for comparing build artifacts between Git branches.

Visually inspect compiled output differences during PR reviews.

## Installation

```bash
npm install -g babbage
# or
npx babbage
```

## Quick Start

```bash
# Compare build artifacts between two branches
npx babbage run ./my-repo \
  --base main \
  --head feature-branch \
  --include "src/**/*.js" \
  -o diff.html
```

This command:
1. Switches to `main` branch → builds → captures artifacts
2. Switches to `feature-branch` → builds → captures artifacts
3. Generates an HTML diff of the two results

## Include Pattern (Required)

The `--include` option is **required** and specifies files to capture using glob patterns.

### Pattern Guidelines

```bash
# Good: Specific paths
--include "apps/web/src/**/*.mjs"      # Only specific app's src
--include "src/**/*.js"                 # Only JS under src
--include "dist/**/*.js"                # Only dist folder

# Bad: Too broad
--include "**/*.mjs"                    # May include node_modules
--include "*.js"                        # All JS files
```

### Multiple Patterns

```bash
# Use multiple --include options
babbage run . --base main --head feature \
  --include "apps/web/src/**/*.mjs" \
  --include "packages/lib/src/**/*.js"
```

### Configuration File

Create a `.babbage` file in your project root:

```json
{
  "buildCommand": "pnpm build",
  "include": [
    "apps/web/src/**/*.mjs",
    "packages/lib/src/**/*.js"
  ]
}
```

## CLI Commands

### `run` - Full Pipeline

The most common usage. Runs the entire comparison process at once.

```bash
babbage run <repo> --base <branch> --head <branch> [options]
```

**Examples:**
```bash
# Basic usage
babbage run . --base main --head feature/new-ui --include "src/**/*.js"

# Custom build command
babbage run . --base main --head develop \
  --build "npm run build" \
  --include "dist/**/*.js"

# Multiple patterns
babbage run . --base main --head feature \
  --include "apps/web/src/**/*.mjs" \
  --include "packages/lib/src/**/*.js"

# Save output to file
babbage run . --base main --head feature \
  --include "src/**/*.js" \
  -o diff.html

# Skip git push (for local testing)
babbage run . --base main --head feature \
  --include "src/**/*.js" \
  --no-push
```

### `capture` - Single Branch Capture

Capture build artifacts from a specific branch. Useful when one branch is already captured.

```bash
babbage capture <repo> <branch> [options]
```

**Examples:**
```bash
babbage capture . main --include "src/**/*.js"
babbage capture . feature-branch \
  --build "yarn build" \
  --include "dist/**/*.js"
```

### `diff` - Generate Diff HTML

Generate diff HTML from already captured branches.

```bash
babbage diff <repo> <base> <head> [options]
```

**Examples:**
```bash
babbage diff . main feature-branch -o diff.html
```

### `deploy` - Deploy Diff HTML

Deploy generated diff HTML to surge.sh for sharing.

```bash
babbage deploy <html-file> [options]
```

**Examples:**
```bash
# Deploy with random domain
babbage deploy diff.html

# Custom domain
babbage deploy diff.html -d my-diff.surge.sh
```

## Options

| Option | Description | Default |
|--------|-------------|---------|
| `-b, --build <cmd>` | Build command | `yarn && yarn build` |
| `-i, --include <glob>` | File pattern to capture (glob, can be specified multiple times) | **Required** |
| `-o, --output <file>` | Output file path | stdout |
| `--clean` | Clean previous artifacts before building | false |
| `--no-push` | Skip git push | false |

CLI options take precedence over config file (`.babbage`).

## How It Works

1. **Capture**: Run build on each branch, copy files matching pattern to `_artifacts/{branch}/`
2. **Store**: Commit artifacts to an orphan branch called `reified` (for history tracking)
3. **Compare**: Compare `_artifacts` directories using `diff -ruN`
4. **Render**: Generate beautiful HTML using [diff2html](https://diff2html.xyz/)

## Usage Examples

### ReScript Project

```bash
# Compare only .mjs files under apps/web/src
babbage run . --base main --head feature \
  --include "apps/web/src/**/*.mjs"
```

### TypeScript Project

```bash
babbage run . --base main --head feature \
  --build "npm run build" \
  --include "dist/**/*.js"
```

### Monorepo Project

```bash
# Compare build artifacts from multiple packages
babbage run . --base main --head feature \
  --build "pnpm build" \
  --include "packages/*/dist/**/*.js" \
  --include "apps/*/build/**/*.js"
```

## Programmatic Usage

```typescript
import { capture, diff, run } from 'babbage';

// Full pipeline
await run({
  repo: '.',
  base: 'main',
  head: 'feature',
  buildCommand: 'npm run build',
  include: ['src/**/*.js', 'lib/**/*.js'],
  output: 'diff.html',
});

// Individual commands
await capture({
  repo: '.',
  branch: 'main',
  buildCommand: 'npm run build',
  include: ['src/**/*.js'],
});

await diff({
  repo: '.',
  base: 'main',
  head: 'feature',
  output: 'diff.html',
});
```

## License

MIT
