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
# First run - scans local data and opens browser to import
vibetracking

# Login to sync data automatically
vibetracking login

# Sync data (after login)
vibetracking sync

# Check current user
vibetracking whoami

# Logout
vibetracking logout
```

### Cursor Integration

```bash
# Login to Cursor to include usage data
vibetracking cursor login

# Check Cursor status
vibetracking cursor status

# Logout from Cursor
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
| Cursor | API sync (requires login) |

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
