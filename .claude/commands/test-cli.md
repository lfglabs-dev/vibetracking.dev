# Manual CLI Testing

This command prepares the CLI package for manual testing and provides the exact terminal commands to run.

## What This Does

1. Builds the CLI package in development mode
2. Links it locally for testing
3. Provides commands you can run to test the full flow

---

## Step 1: Prepare the CLI Package

First, let me build and prepare the CLI for testing:

```bash
cd packages/cli && bun install && bun build src/index.ts --outdir=dist --target=node
```

## Step 2: Run Unit Tests

Before manual testing, run the automated tests:

```bash
cd packages/cli && bun test
```

Expected: All tests pass (aggregator, parsers, encoder, integration)

---

## Step 3: Manual Testing Commands

### Test 1: Basic CLI Run (Default Command)

This scans your local machine for AI tool data and shows stats:

```bash
cd packages/cli && bun run src/index.ts
```

**Expected behavior:**
- Scans for Claude Code data at `~/.claude/stats-cache.json`
- Scans for Codex data at `~/.codex/cache.toml`
- Displays stats summary in terminal
- Opens browser to import page with encoded data

### Test 2: Sync Command (Background Sync)

Tests the CLI sync to server:

```bash
cd packages/cli && bun run src/index.ts sync --quiet
```

**Expected behavior:**
- Syncs data to server silently
- Returns exit code 0 on success

### Test 3: Autosync Status

Check autosync configuration:

```bash
cd packages/cli && bun run src/index.ts autosync status
```

**Expected behavior:**
- Shows whether autosync is enabled/disabled
- Shows hook installation status

### Test 4: Enable/Disable Autosync

```bash
# Enable autosync
cd packages/cli && bun run src/index.ts autosync on

# Disable autosync
cd packages/cli && bun run src/index.ts autosync off
```

**Expected behavior:**
- Installs/removes hooks in `~/.claude/settings.json`
- Installs/removes hooks in `~/.codex/config.toml`

---

## Step 4: Test with Mock Data

If you don't have real tool data, create mock files:

### Create Mock Claude Data

```bash
mkdir -p ~/.claude
cat > ~/.claude/stats-cache.json << 'EOF'
{
  "sessions": [
    {
      "id": "test-session-1",
      "startTime": 1702656000000,
      "endTime": 1702663200000,
      "messageCount": 50,
      "inputTokens": 25000,
      "outputTokens": 15000,
      "cacheReadTokens": 10000,
      "model": "claude-sonnet-4-20250514"
    }
  ]
}
EOF
```

### Run CLI with Mock Data

```bash
cd packages/cli && bun run src/index.ts
```

---

## Step 5: Test Data Encoding/Decoding

Test the encoder directly:

```bash
cd packages/cli && bun -e "
import { encodeImportData, decodeImportData } from './src/encoder.ts';

const testData = {
  timestamp: Date.now(),
  version: 1,
  tools: {
    claude_code: {
      tool: 'claude_code',
      dailyActivity: [{ date: '2024-12-15', tool: 'claude_code', messageCount: 10, sessionCount: 1, totalTokens: 5000 }],
      modelUsage: [{ model: 'claude-sonnet-4-20250514', inputTokens: 3000, outputTokens: 2000 }],
      stats: { totalTokens: 5000, totalSessions: 1, totalMessages: 10, longestSessionMs: 3600000, firstActivityDate: '2024-12-15', lastActivityDate: '2024-12-15' }
    }
  }
};

const encoded = encodeImportData(testData);
console.log('Encoded length:', encoded.length);
console.log('First 50 chars:', encoded.substring(0, 50));

const decoded = decodeImportData(encoded);
console.log('Round-trip success:', JSON.stringify(decoded) === JSON.stringify(testData));
"
```

---

## Step 6: Integration Test with Dev Server

### Start the Dev Server

In a separate terminal:

```bash
pnpm dev
```

### Run CLI and Complete Flow

```bash
cd packages/cli && bun run src/index.ts
```

1. CLI opens browser to `http://localhost:3000/import#[encoded-data]`
2. Complete registration in browser
3. Verify profile shows correct stats

---

## Test Checklist

| Test | Command | Expected |
|------|---------|----------|
| Unit tests | `bun test` | All pass |
| Default run | `bun run src/index.ts` | Shows stats, opens browser |
| Sync | `bun run src/index.ts sync` | Syncs to server |
| Autosync status | `bun run src/index.ts autosync status` | Shows status |
| Autosync on | `bun run src/index.ts autosync on` | Installs hooks |
| Autosync off | `bun run src/index.ts autosync off` | Removes hooks |
| Encoder round-trip | See Step 5 | Data matches |
| Full flow | With dev server | Profile created |

---

## Troubleshooting

### "No data found"
- Check `~/.claude/stats-cache.json` exists
- Create mock data (see Step 4)

### "Cannot find module"
- Run `bun install` in packages/cli

### "Browser doesn't open"
- URL is printed to console, open manually

### "Sync fails"
- Check dev server is running
- Check `.env.vibetracking` has correct Supabase credentials
