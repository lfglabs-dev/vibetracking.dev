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

### Test 2: Challenge Flow (--inviter flag)

Test the challenge invitation feature:

```bash
cd packages/cli && bun run --conditions=browser src/cli.ts --inviter fricoben
# or short form:
cd packages/cli && bun run --conditions=browser src/cli.ts -i fricoben
```

**Expected behavior:**
- Shows "Accepting challenge from @fricoben"
- Opens browser to `vibetracking.dev/import?inviter=fricoben#[encoded_data]`

---

## Step 3: Cursor Integration

If Cursor is installed, the CLI will automatically:

1. Open your browser to `cursor.com/api/dashboard/export-usage-events-csv`
2. Wait for the CSV to download
3. Detect the download in your Downloads folder
4. Import it alongside other AI tool data

**If auto-detection fails:**
- The CLI will prompt you to drag-and-drop the CSV file
- Or press Enter to skip Cursor data

**Expected behavior:**
```bash
cd packages/cli && bun run --conditions=browser src/cli.ts
```

- Shows "Cursor detected! Opening browser to download your usage data..."
- Browser opens to Cursor export URL
- Shows "Waiting for download..."
- When detected: "Found: usage-events-YYYY-MM-DD.csv"
- Shows "Imported X Cursor usage events."

---

## Step 4: Integration Test with Dev Server

### Start the Dev Server

```bash
pnpm dev
```

### Test Full Import Flow

```bash
VIBETRACKING_API_URL=http://localhost:3000 cd packages/cli && bun run --conditions=browser src/cli.ts
```

1. Browser opens to `http://localhost:3000/import#[data]`
2. Login with GitHub
3. Complete company field (if first time)
4. Verify profile shows correct stats

### Test Challenge Flow Locally

```bash
VIBETRACKING_API_URL=http://localhost:3000 cd packages/cli && bun run --conditions=browser src/cli.ts -i testuser
```

---

## Test Checklist

| Test | Command | Expected |
|------|---------|----------|
| Default (browser) | `src/cli.ts` | Shows stats, opens browser |
| Inviter flag | `src/cli.ts -i username` | Adds inviter param to URL |
| Cursor auto-detect | (with Cursor installed) | Opens browser, detects download |
| Cursor drag-drop | (skip auto-detect) | Prompts for file, accepts drag-drop |
| Skip Cursor | (press Enter at prompt) | Continues without Cursor data |

---

## Data Locations

The CLI scans these locations:

| Tool | Data Path |
|------|-----------|
| Claude Code | `~/.claude/projects/` |
| Codex | `~/.codex/` |
| OpenCode | `~/.local/share/opencode/` |
| Gemini | `~/.gemini/` |
| Cursor | Browser CSV download → `~/.vibetracking/cursor-cache/` |
| Amp | `~/.ampcode/sessions/` |
| Droid | `~/Library/.../googleAiStudio/history/` |

---

## Config Locations

| File | Purpose |
|------|---------|
| `~/.vibetracking/cursor-cache/usage.csv` | Cached Cursor data (from browser download) |
| `~/.cache/vibetracking/pricing-litellm.json` | Cached LiteLLM pricing |
| `~/.cache/vibetracking/pricing-openrouter.json` | Cached OpenRouter pricing |

---

## Troubleshooting

### "Native module not available"
- Build the core: `cd packages/core && bun run build`
- Check Rust version: `rustc --version` (needs >= 1.88)

### "No data found"
- Check if you have data in `~/.claude/` or `~/.codex/`
- For Cursor: make sure you're logged into cursor.com in your browser

### "Browser doesn't open"
- URL is printed to console, open manually
- Check if `open` package is installed

### Import page shows "Invalid data"
- Data encoding issue - check CLI output for errors
- Try running CLI again to regenerate data
