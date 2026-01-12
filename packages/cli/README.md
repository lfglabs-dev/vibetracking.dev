# vibetracking

Track AI coding assistant usage across Claude Code, Codex, Cursor, Gemini, Amp, and more.

## Requirements

- [Bun](https://bun.sh) >= 1.0

## Installation

```bash
# One-off execution
bunx vibetracking

# Global install
bun add -g vibetracking
```

## Usage

```bash
# Run - scans local data and opens browser to import
vibetracking

# Sync data (alias of vibetracking)
vibetracking sync

# Login (handled in browser during import)
vibetracking login

# Check CLI auth status
vibetracking whoami

# Logout (clears local cache only)
vibetracking logout
```

### Cursor Integration

```bash
# Open Cursor export page (login in browser if needed)
vibetracking cursor login

# Check Cursor cache status
vibetracking cursor status

# Clear cached Cursor data
vibetracking cursor logout
```

## Supported Tools

| Tool | Data Location |
|------|---------------|
| Claude Code | `~/.claude/projects/` |
| Codex | `~/.codex/` |
| OpenCode | `~/.local/share/opencode/` |
| Gemini | `~/.gemini/` |
| Amp | `~/.ampcode/` |
| Cursor | Browser CSV export (requires login) |

## How It Works

1. **Scan**: Vibetracking scans your local AI coding tool data
2. **Parse**: Native Rust module parses session files in parallel
3. **Calculate**: Estimates costs using real-time model pricing from LiteLLM
4. **Import**: Opens browser to import data to vibetracking.dev
5. **Share**: View your stats, compare on leaderboards, share your profile

## Links

- Website: https://vibetracking.dev
- GitHub: https://github.com/lfglabs/vibetracking

## License

MIT
