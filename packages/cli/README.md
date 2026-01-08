# vibetracking

Track your AI coding tool usage across Claude Code, Codex, and Cursor.

## Installation

```bash
npm install -g vibetracking
```

Or run directly without installing:

```bash
npx vibetracking
```

## Usage

```bash
# Scan local tools and view your stats
vibetracking

# Background sync (for automation)
vibetracking sync --quiet

# Enable auto-sync hooks for Claude Code and Codex
vibetracking autosync on

# Disable auto-sync
vibetracking autosync off

# Check auto-sync status
vibetracking autosync status
```

## Supported Tools

| Tool | Data Location |
|------|---------------|
| Claude Code | `~/.claude/stats-cache.json` |
| Codex | `~/.codex/` |
| Cursor | Manual CSV export from app |

## What It Tracks

- Total tokens consumed (input + output)
- Model usage breakdown
- Session counts and activity
- Estimated API spending
- Daily activity patterns

## Requirements

- Node.js 18+
- One or more supported AI coding tools installed

## Links

- Website: [vibetracking.dev](https://vibetracking.dev)
