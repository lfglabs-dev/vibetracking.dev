# Manual CLI Testing

This command guides you through testing the vibetracking CLI.

## Prerequisites

**Build Requirements:**
- Bun >= 1.0
- Node.js >= 20.12 (for napi-rs tooling)
- Rust >= 1.88 (for native core)

---

## Step 1: Build the Native Core

The CLI requires the Rust native module for parsing:

```bash
cd packages/core && bun run build
```

If Rust version is too old, update with:
```bash
rustup update
```

---

## Step 2: Run the CLI

### Test 1: Default Command (Browser-First)

Scans local AI tool data and opens browser for import:

```bash
cd packages/cli && bun run --conditions=browser src/cli.ts
```

**Expected behavior:**
- Scans for data from 7 sources (Claude Code, Codex, Cursor, OpenCode, Gemini, Amp, Droid)
- Shows token count and estimated cost
- Opens browser to `vibetracking.dev/import#[encoded_data]`

### Test 2: Models Report

Shows usage breakdown by model:

```bash
cd packages/cli && bun run --conditions=browser src/cli.ts models
```

Options:
- `--today` - Today only
- `--week` - Last 7 days
- `--month` - Current month
- `--year 2024` - Specific year
- `--json` - Output as JSON
- `--benchmark` - Show processing time

### Test 3: Monthly Report

Shows monthly breakdown:

```bash
cd packages/cli && bun run --conditions=browser src/cli.ts monthly
```

### Test 4: Graph Export

Export contribution graph data as JSON:

```bash
cd packages/cli && bun run --conditions=browser src/cli.ts graph --output graph.json
```

### Test 5: Wrapped Image Generation

Generate a year-in-review image:

```bash
cd packages/cli && bun run --conditions=browser src/cli.ts wrapped
```

Options:
- `--year 2024` - Specific year
- `--output my-wrapped.png` - Custom filename
- `--short` - Abbreviated token numbers
- `--clients` - Show clients instead of agents

### Test 6: Sync Command

Sync data to vibetracking.dev (requires prior authentication):

```bash
cd packages/cli && bun run --conditions=browser src/cli.ts sync
```

Options:
- `--quiet` - Minimal output for background syncing

### Test 7: Pricing Lookup

Look up model pricing:

```bash
cd packages/cli && bun run --conditions=browser src/cli.ts pricing claude-sonnet-4-20250514
```

Options:
- `--json` - Output as JSON
- `--provider litellm` - Force specific pricing source

---

## Step 3: Cursor Integration

### Login to Cursor

```bash
cd packages/cli && bun run --conditions=browser src/cli.ts cursor login
```

You'll need to:
1. Open https://www.cursor.com/settings
2. Open DevTools > Network tab
3. Find any request to cursor.com/api
4. Copy the `WorkosCursorSessionToken` cookie value

### Check Cursor Status

```bash
cd packages/cli && bun run --conditions=browser src/cli.ts cursor status
```

### Logout from Cursor

```bash
cd packages/cli && bun run --conditions=browser src/cli.ts cursor logout
```

---

## Step 4: Filter by Source

All commands support source filtering:

```bash
# Only Claude Code data
cd packages/cli && bun run --conditions=browser src/cli.ts models --claude

# Only Cursor data
cd packages/cli && bun run --conditions=browser src/cli.ts models --cursor

# Multiple sources
cd packages/cli && bun run --conditions=browser src/cli.ts models --claude --codex
```

Available filters: `--opencode`, `--claude`, `--codex`, `--gemini`, `--cursor`, `--amp`, `--droid`

---

## Step 5: Integration Test with Dev Server

### Start the Dev Server

```bash
pnpm dev
```

### Test Full Import Flow

```bash
# Set local API URL
VIBETRACKING_API_URL=http://localhost:3000 cd packages/cli && bun run --conditions=browser src/cli.ts
```

1. Browser opens to `http://localhost:3000/import#[data]`
2. Complete registration
3. Verify profile shows correct stats

### Test Sync Flow

```bash
VIBETRACKING_API_URL=http://localhost:3000 cd packages/cli && bun run --conditions=browser src/cli.ts sync
```

---

## Test Checklist

| Test | Command | Expected |
|------|---------|----------|
| Default (browser) | `src/cli.ts` | Shows stats, opens browser |
| Models report | `src/cli.ts models` | Table with token breakdown |
| Monthly report | `src/cli.ts monthly` | Monthly table |
| Graph export | `src/cli.ts graph --output g.json` | JSON file created |
| Wrapped | `src/cli.ts wrapped` | PNG image created |
| Pricing | `src/cli.ts pricing claude-sonnet-4-20250514` | Shows pricing info |
| Cursor login | `src/cli.ts cursor login` | Prompts for token |
| Cursor status | `src/cli.ts cursor status` | Shows auth status |
| JSON output | `src/cli.ts models --json` | JSON to stdout |
| Date filter | `src/cli.ts models --today` | Today's data only |
| Source filter | `src/cli.ts models --claude` | Claude data only |
| Sync | `src/cli.ts sync` | Syncs to server |

---

## Data Locations

The CLI scans these locations:

| Tool | Data Path |
|------|-----------|
| Claude Code | `~/.claude/projects/` |
| Codex | `~/.codex/` |
| OpenCode | `~/.local/share/opencode/` |
| Gemini | `~/.gemini/` |
| Cursor | Via API (requires login) |
| Amp | `~/.amp/` |
| Droid | `~/.droid/` |

---

## Config Locations

| File | Purpose |
|------|---------|
| `~/.vibetracking/credentials.json` | Vibetracking auth token |
| `~/.vibetracking/cursor-credentials.json` | Cursor session token |
| `~/.vibetracking/cursor-cache/usage.csv` | Cached Cursor data |
| `~/.cache/vibetracking/images/` | Cached logos for wrapped |
| `~/.cache/vibetracking/fonts/` | Cached fonts for wrapped |

---

## Troubleshooting

### "Native module not available"
- Build the core: `cd packages/core && bun run build`
- Check Rust version: `rustc --version` (needs >= 1.88)

### "No data found"
- Check if you have data in `~/.claude/` or `~/.codex/`
- For Cursor: run `vibetracking cursor login` first

### "Browser doesn't open"
- URL is printed to console, open manually
- Check if `open` package is installed

### "Sync failed: Not authenticated"
- Run `vibetracking` first to authenticate via browser
- Credentials saved to `~/.vibetracking/credentials.json`

### Import page shows "Invalid data"
- Data encoding issue - check CLI output for errors
- Try `--json` flag to see raw data structure
