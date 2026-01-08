# Vibetracking.dev - AI Coding Tool Usage Tracker

## Deployment

This repo is connected to **Vercel** for automatic deployments:

- **Production**: https://vibetracking.dev (deploys from `main` branch)
- **Preview**: Automatic preview deployments for all branches/PRs
- **Vercel Project**: `lfglabs/vibetracking.dev`
- **Dashboard**: https://vercel.com/lfglabs/vibetracking.dev

### Vercel Environment Variables

Environment variables are configured in Vercel dashboard for both Production and Preview environments:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `VIBETRACKING_URL`

---

## The Concept

**Vibetracking.dev** is a web application that tracks and visualizes AI coding tool usage statistics. It aggregates usage data from three AI coding assistants:

- **Claude Code** - Anthropic's CLI coding assistant
- **Codex** - OpenAI's coding CLI tool
- **Cursor** - AI-powered code editor (via CSV export)

The app presents user statistics in an engaging, gamified interface with:
- Global leaderboards ranked by estimated API spending
- Personal dashboards with activity heatmaps
- Model usage breakdowns and charts
- Fun comparisons (tokens = novels, marathons, etc.)
- Streak tracking and achievement badges

**Target Users**: Developers who want to understand and share their AI coding tool usage patterns - tokens consumed, models used, session activity, and estimated API spending.

---

## Architecture Overview

### Monorepo Structure

```
riyadh/
├── src/                    # Next.js web application
│   ├── app/               # App Router pages & API routes
│   ├── components/        # React components
│   ├── lib/               # Utilities & Supabase client
│   └── middleware.ts      # URL rewriting (/@user → /user/user)
├── packages/cli/          # Bun-based CLI tool
│   └── src/
│       ├── parsers/       # Tool-specific data parsers
│       ├── __tests__/     # Unit & integration tests
│       └── index.ts       # CLI entry point
├── supabase/migrations/   # Database schema
├── public/                # Static assets
└── scripts/               # Manual test scripts
```

### Tech Stack

| Component | Technology |
|-----------|------------|
| **Web Framework** | Next.js 16 + React 19 |
| **Database** | Supabase (PostgreSQL) |
| **Authentication** | GitHub OAuth via Supabase Auth |
| **Styling** | Tailwind CSS v4 |
| **Charts** | Recharts v3 |
| **CLI Runtime** | Bun |
| **CLI Framework** | Commander.js |
| **Compression** | Pako (gzip) |
| **Deployment** | Vercel |

---

## Data Flow

```
┌─────────────────────────────┐
│      Local Machine          │
├─────────────────────────────┤
│ Claude: ~/.claude/stats-cache.json
│ Codex:  ~/.codex/cache.toml
│ Cursor: ~/Downloads/*.csv (manual)
└───────────────┬─────────────┘
                │
                ▼
┌─────────────────────────────┐
│   CLI (bunx vibetracking)   │
├─────────────────────────────┤
│ 1. Parse tool data files    │
│ 2. Aggregate statistics     │
│ 3. Compress (gzip+base64url)│
└───────────────┬─────────────┘
                │
    ┌───────────┴───────────┐
    ▼                       ▼
┌───────────────┐   ┌───────────────┐
│ Browser Import│   │ API Auto-sync │
│ /import#data  │   │ POST /api/sync│
└───────┬───────┘   └───────┬───────┘
        │                   │
        └─────────┬─────────┘
                  ▼
┌─────────────────────────────┐
│   Supabase (PostgreSQL)     │
├─────────────────────────────┤
│ users, daily_activity,      │
│ token_usage, user_stats,    │
│ sync_tokens                 │
└─────────────────────────────┘
```

---

## Database Schema

### Tables

1. **users** - User profiles
   - `id`, `github_id`, `username`, `display_name`, `avatar_url`, `company`
   - `is_anonymous`, `anonymous_id` (for non-GitHub users)

2. **daily_activity** - Heatmap data
   - `user_id`, `date`, `tool`, `message_count`, `session_count`, `total_tokens`

3. **token_usage** - Model breakdown
   - `user_id`, `date`, `tool`, `model`, `input_tokens`, `output_tokens`

4. **user_stats** - Aggregated statistics
   - `total_tokens`, `total_sessions`, `favorite_model`, `favorite_tool`
   - `longest_session_ms`, streaks, activity dates

5. **sync_tokens** - CLI authentication
   - Bearer tokens for background/headless syncing

### Security

- Row Level Security (RLS) enabled on all tables
- Public read access for profiles and stats
- Write access restricted to authenticated users (own data)

---

## Key Components

### Web Application (`src/`)

| Path | Purpose |
|------|---------|
| `app/page.tsx` | Homepage with leaderboard |
| `app/user/[username]/page.tsx` | User profile page |
| `app/import/page.tsx` | Data import flow |
| `app/api/import/route.ts` | Browser import endpoint |
| `app/api/sync/route.ts` | CLI sync endpoint |
| `app/api/leaderboard/route.ts` | Leaderboard data |
| `components/dashboard/` | Charts (heatmap, model usage, etc.) |
| `lib/pricing.ts` | Model pricing calculations |
| `lib/supabase/` | Supabase client & middleware |

### CLI Package (`packages/cli/`)

| File | Purpose |
|------|---------|
| `index.ts` | Main CLI entry, Commander setup |
| `parsers/claude.ts` | Parse Claude Code stats-cache.json |
| `parsers/codex.ts` | Parse Codex cache.toml |
| `parsers/cursor.ts` | Parse Cursor CSV export |
| `aggregator.ts` | Combine data from all tools |
| `encoder.ts` | Gzip + base64url encoding |
| `hooks.ts` | Install auto-sync hooks |
| `config.ts` | Local config storage |

---

## Running the Project

### Prerequisites

- Node.js 18+ or Bun
- pnpm (workspace manager)
- Supabase project (for database)
- GitHub OAuth app (for authentication)

### Environment Variables

Create `.env.vibetracking` with:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_KEY=xxx  # For server-side operations
```

### Development

```bash
# Install dependencies
pnpm install

# Run the web app
pnpm dev              # Uses dotenvx to load .env.vibetracking

# CLI development (in packages/cli/)
cd packages/cli
bun run src/index.ts  # Run CLI directly
bun test              # Run tests
```

---

## Testing

### Test Command Structure

| Command | Purpose | Time |
|---------|---------|------|
| `/e2e/test-quick` | Fast smoke test | ~2 min |
| `/e2e/test-homepage` | Homepage (auth + unauth) | ~5 min |
| `/e2e/test-import` | Import page flow | ~5 min |
| `/e2e/test-profile` | Profile page tests | ~8 min |
| `/e2e/test-full-suite` | Complete regression | ~20 min |
| `/test-cli` | CLI manual testing | Manual |
| `/test-onboarding` | Quick onboarding flow | ~3 min |

### 1. CLI Unit Tests (packages/cli/)

The CLI has comprehensive tests using Bun's built-in test framework:

```bash
cd packages/cli
bun test                    # Run all tests
bun test src/__tests__/claude.test.ts  # Run specific test
```

**Test files:**
- `aggregator.test.ts` - Data aggregation logic
- `claude.test.ts` - Claude Code parser
- `codex.test.ts` - Codex parser
- `cursor.test.ts` - Cursor CSV parser
- `encoder.test.ts` - Compression/encoding round-trip
- `integration.test.ts` - Full CLI flow

### 2. CLI Manual Testing

Use `/test-cli` for manual CLI testing. It prepares the package and provides exact commands:

```bash
# Run unit tests first
cd packages/cli && bun test

# Test default command (scans local tools, opens browser)
cd packages/cli && bun run src/index.ts

# Test sync command
cd packages/cli && bun run src/index.ts sync --quiet

# Test autosync
cd packages/cli && bun run src/index.ts autosync status
```

### 3. Browser E2E Tests (Playwright MCP)

E2E tests use Playwright MCP tools. Credentials from Bitwarden when needed.

#### Prerequisites

1. **Start the dev server:**
   ```bash
   pnpm dev
   # Server runs at http://localhost:3000
   ```

2. **Access test credentials via Bitwarden (when needed):**
   ```bash
   # List available projects
   dotenvx run -f .env.local -- ~/bin/bws project list

   # Get credentials for testing
   dotenvx run -f .env.local -- ~/bin/bws secret get <SECRET_ID> -o json | jq -r '.value'
   ```

#### E2E Test Commands

| Command | What it Tests |
|---------|---------------|
| `/e2e/test-quick` | Smoke test: homepage → import → registration → profile |
| `/e2e/test-homepage` | Homepage layout, copy button, leaderboard, auth states |
| `/e2e/test-import` | Error states, data preview, registration flow |
| `/e2e/test-profile` | Profile sections, responsive design, share button |
| `/e2e/test-full-suite` | All of the above in dependency order (creates 2 test users) |

#### Test Flow with Playwright MCP

1. **Navigate to page:**
   ```
   mcp__playwright__browser_navigate: http://localhost:3000
   ```

2. **Get page structure:**
   ```
   mcp__playwright__browser_snapshot
   ```

3. **Interact with elements:**
   ```
   mcp__playwright__browser_click: ref="element-ref", element="description"
   mcp__playwright__browser_type: ref="input-ref", text="value"
   ```

4. **Check for errors:**
   ```
   mcp__playwright__browser_console_messages: level="error"
   ```

5. **Take screenshots:**
   ```
   mcp__playwright__browser_take_screenshot: filename="test-result.png"
   ```

#### Authenticated Testing with Bitwarden

For tests requiring GitHub login or other authenticated flows:

```bash
# 1. Get credentials from Bitwarden
EMAIL=$(dotenvx run -f .env.local -- ~/bin/bws secret get <EMAIL_SECRET_ID> -o json | jq -r '.value')
PASSWORD=$(dotenvx run -f .env.local -- ~/bin/bws secret get <PASSWORD_SECRET_ID> -o json | jq -r '.value')

# 2. Use with Playwright MCP:
#    - browser_navigate to login page
#    - browser_type to fill email field
#    - browser_type to fill password field
#    - browser_click on submit
#    - browser_snapshot to verify authenticated state
```

### 4. Quick Onboarding Test

For a fast end-to-end check:

```bash
pnpm test:onboarding    # Runs scripts/test-onboarding.ts
```

Or use the slash command:
```
/test-onboarding
```

---

## CLI Commands

### Main Commands

```bash
bunx vibetracking              # Scan tools, show stats, open browser
bunx vibetracking sync         # Sync data to server (background)
bunx vibetracking autosync on  # Enable automatic syncing
bunx vibetracking autosync off # Disable automatic syncing
bunx vibetracking autosync status
```

### Hook Integration

The CLI installs hooks for automatic syncing:

- **Claude Code**: `~/.claude/settings.json` - runs `vibetracking sync --quiet` on exit
- **Codex**: `~/.codex/config.toml` - runs on session end

---

## API Routes

| Endpoint | Method | Purpose | Auth |
|----------|--------|---------|------|
| `/api/import` | POST | Browser-based data import | GitHub OAuth |
| `/api/sync` | POST | CLI background sync | Bearer token |
| `/api/leaderboard` | GET | Get leaderboard data | None |
| `/og/user/[username]` | GET | Open Graph image | None |
| `/auth/callback` | GET | GitHub OAuth callback | - |

---

## URL Rewriting

The middleware (`src/middleware.ts`) handles URL patterns:

- `/@username` → `/user/username` (Twitter-style URLs)
- `/username` → `/user/username` (clean URLs, except reserved paths)

Reserved paths that are NOT rewritten:
- `/api/*`, `/import`, `/auth/*`, `/_next/*`, `/og/*`

---

## Development Workflow

### Adding a New Feature

1. Create/modify components in `src/components/`
2. Update API routes in `src/app/api/`
3. Add database migrations in `supabase/migrations/`
4. Test locally with `pnpm dev`
5. Run E2E tests with Playwright MCP

### CLI Changes

1. Modify code in `packages/cli/src/`
2. Add/update tests in `packages/cli/src/__tests__/`
3. Run tests: `cd packages/cli && bun test`
4. Test manually: `bun run src/index.ts`

---

## Key Files Reference

| File | What it does |
|------|--------------|
| `src/lib/pricing.ts` | Model pricing data & USD calculations |
| `src/lib/utils.ts` | Number formatting, date utilities |
| `src/lib/mockData.ts` | Demo users for testing |
| `packages/cli/src/encoder.ts` | Data compression for URL-safe transfer |
| `packages/cli/src/hooks.ts` | Auto-sync hook installation |

---

## Troubleshooting

### Common Issues

1. **"No data found" on import page**
   - Ensure the URL has `#encoded-data` hash
   - Run `bunx vibetracking` to generate fresh data

2. **CLI can't find tool data**
   - Claude Code: Check `~/.claude/stats-cache.json` exists
   - Codex: Check `~/.codex/cache.toml` exists
   - Cursor: Export CSV from app to ~/Downloads/

3. **Database connection issues**
   - Verify `.env.vibetracking` has correct Supabase credentials
   - Check Supabase project is active

4. **E2E tests failing**
   - Ensure dev server is running on port 3000
   - Check Playwright MCP is available
   - Verify Bitwarden access token is configured
