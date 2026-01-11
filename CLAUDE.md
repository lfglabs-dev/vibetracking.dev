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

**Vibetracking.dev** is a web application that tracks and visualizes AI coding tool usage statistics. It aggregates usage data from multiple AI coding assistants:

- **OpenCode** - Open-source AI coding CLI
- **Claude Code** - Anthropic's CLI coding assistant
- **Codex** - OpenAI's coding CLI tool
- **Cursor** - AI-powered code editor (via API sync)
- **Gemini** - Google's AI coding assistant
- **Amp** - Sourcegraph's AI coding assistant
- **Droid** - Android Studio AI assistant

The app presents user statistics in an engaging, gamified interface with:
- Global leaderboards ranked by estimated API spending
- Personal dashboards with activity heatmaps
- Model usage breakdowns and charts
- Fun comparisons (tokens = novels, marathons, etc.)
- Streak tracking and achievement badges

**Target Users**: Developers who want to understand and share their AI coding tool usage patterns - tokens consumed, models used, session activity, and estimated API spending.

---

## CLI Origin & Development Philosophy

> **IMPORTANT: The CLI is based on [tokscale](https://github.com/junhoyeo/tokscale) and we aim to keep it that way.**

The native CLI (`packages/cli/` and `packages/core/`) is derived from the [tokscale project](https://github.com/junhoyeo/tokscale/commits/main/) by [@junhoyeo](https://github.com/junhoyeo). Our strategy is to:

1. **Minimize CLI changes** - Make as few modifications to the core CLI as possible
2. **Focus on the frontend** - Our value-add is the web application, UI/UX, and viral features
3. **Stay upstream-compatible** - Keep the CLI architecture aligned with tokscale for easier merging of improvements

### What this means in practice:

- **DO NOT** refactor or restructure the CLI/core packages unless absolutely necessary
- **DO NOT** change the data formats or parsing logic without strong justification
- **PREFER** fixing bugs upstream in tokscale when possible
- **KEEP** changes to `packages/cli/` and `packages/core/` minimal and well-documented
- **FOCUS** development effort on `src/` (the Next.js web app)

### When CLI changes ARE acceptable:

- Bug fixes that can't wait for upstream
- Adding support for new AI tools (following existing patterns)
- Integration changes needed for vibetracking.dev specifically (auth, submission)

---

## Architecture Overview

### Monorepo Structure

```
krakow/
├── src/                    # Next.js web application
│   ├── app/               # App Router pages & API routes
│   ├── components/        # React components
│   ├── lib/               # Utilities & Supabase client
│   └── middleware.ts      # URL rewriting (/@user → /user/user)
├── packages/
│   ├── cli/               # Bun-based CLI tool (TypeScript)
│   │   └── src/
│   │       ├── cli.ts         # Main CLI entry point
│   │       ├── auth.ts        # Device flow authentication
│   │       ├── submit.ts      # Data submission to API
│   │       ├── native.ts      # Native module bindings
│   │       └── cursor.ts      # Cursor API sync
│   └── core/              # Native Rust module (NAPI-RS)
│       └── src/
│           ├── lib.rs         # Main exports & NAPI bindings
│           ├── sessions/      # Tool-specific parsers
│           ├── pricing/       # LiteLLM & OpenRouter pricing
│           ├── scanner.rs     # File system scanner
│           └── aggregator.rs  # Data aggregation
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
| **Native Core** | Rust + NAPI-RS v3 |
| **JSON Parsing** | simd-json (SIMD-accelerated) |
| **Parallelism** | Rayon (Rust) |
| **Deployment** | Vercel |

---

## Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                     Local Machine                            │
├─────────────────────────────────────────────────────────────┤
│ OpenCode:  ~/.local/share/opencode/storage/message/**/*.json │
│ Claude:    ~/.claude/projects/**/conversation.jsonl          │
│ Codex:     ~/.codex/tasks/**/*.json                          │
│ Gemini:    ~/.gemini/gemini-cli/conversations/**/*.json      │
│ Amp:       ~/.ampcode/sessions/**/*.json                     │
│ Droid:     ~/Library/.../googleAiStudio/history/*.json       │
│ Cursor:    ~/.vibetracking/cursor-cache/usage.csv (synced)   │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              CLI (vibetracking submit)                       │
├─────────────────────────────────────────────────────────────┤
│ Phase 1 (Parallel):                                          │
│   - Parse local sources (Rust native, parallel)              │
│   - Sync Cursor usage via API                                │
│   - Fetch model pricing (LiteLLM + OpenRouter)               │
│                                                              │
│ Phase 2 (Finalize):                                          │
│   - Apply pricing to all messages                            │
│   - Combine local + Cursor data                              │
│   - Generate TokenContributionData graph                     │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│       Browser: /import#encoded_data                          │
├─────────────────────────────────────────────────────────────┤
│ User logs in with GitHub OAuth in browser                    │
│ Data decoded from URL hash, submitted to /api/import         │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                 Supabase (PostgreSQL)                        │
├─────────────────────────────────────────────────────────────┤
│ users, daily_activity, token_usage, user_stats               │
└─────────────────────────────────────────────────────────────┘
```

---

## Database Schema

### Tables

1. **users** - User profiles
   - `id`, `github_id`, `username`, `display_name`, `avatar_url`, `company`
   - `is_anonymous`, `anonymous_id` (for non-GitHub users)

2. **daily_activity** - Heatmap data
   - `user_id`, `date`, `tool`, `message_count`, `session_count`, `total_tokens`, `cost`
   - Tools: `claude_code`, `codex`, `cursor`, `opencode`, `claude`, `gemini`, `amp`, `droid`

3. **token_usage** - Model breakdown
   - `user_id`, `date`, `tool`, `model`
   - `input_tokens`, `output_tokens`, `cache_read_tokens`, `cache_creation_tokens`, `reasoning_tokens`, `cost`

4. **user_stats** - Aggregated statistics
   - `total_tokens`, `total_cost`, `total_sessions`, `favorite_model`, `favorite_tool`
   - `longest_streak_days`, `current_streak_days`, activity dates

### Security

- Row Level Security (RLS) enabled on all tables
- Public read access for profiles and stats
- Write access restricted to authenticated users (own data)

---

## Atomic UI Architecture

### Component Organization

The project follows an atomic design pattern for chart components:

- **`components/ui/`** - Pure UI primitives (no data fetching, receive data via props)
- **`components/[domain]/`** - Data-connected components that use UI primitives

### Chart UI Primitives

Reusable chart primitives are located in `src/components/ui/charts/`:

| Component | Description | Wraps |
|-----------|-------------|-------|
| `LineChart` | Multi-line time series charts | Recharts LineChart |
| `BarChart` | Horizontal/vertical bar charts | Recharts BarChart |
| `AreaChart` | Single area chart with gradient | Recharts AreaChart |
| `PieChart` | Donut/pie charts | Recharts PieChart |
| `StackedAreaChart` | Stacked percentage area charts | Recharts AreaChart |
| `ChartTooltip` | Consistent tooltip styling | - |
| `ChartCard` | Card wrapper with title slot | - |

### Shared Constants

`src/components/ui/charts/constants.ts` exports:
- `MODEL_COLORS` - Color palette for model charts
- `TOOL_COLORS` - Colors for each AI tool
- `TOOL_LABELS` - Display names for tools
- `AXIS_STYLE` - Consistent axis styling
- `GRID_STYLE` - Grid line styling
- `TOOLTIP_STYLE` - Tooltip container styling
- `getColorFromString()` - Generate consistent color from string

### Usage Pattern

```tsx
// Import from UI primitives
import { LineChart, ChartCard, TOOL_COLORS } from "@/components/ui/charts";

// Data component handles fetching/transformation
export function UsageByToolChart({ dailyActivity, unit }) {
  // Transform data...
  const lines = tools.map(tool => ({
    dataKey: tool,
    color: TOOL_COLORS[tool],
    label: TOOL_LABELS[tool],
  }));

  return (
    <ChartCard title="Usage by IDE" rightSlot={<TimeframeSelector />}>
      <LineChart data={chartData} lines={lines} xAxisKey="date" />
    </ChartCard>
  );
}
```

### Adding New Charts

**DO NOT** create new chart components directly in `dashboard/`. Instead:
1. Check if an existing UI primitive fits your need
2. If not, create a new primitive in `components/ui/charts/`
3. Then create the data-connected component in `components/dashboard/`

---

## Key Components

### Web Application (`src/`)

| Path | Purpose |
|------|---------|
| `app/page.tsx` | Homepage with leaderboard |
| `app/user/[username]/page.tsx` | User profile page |
| `app/import/page.tsx` | Data import flow |
| `app/api/submit/route.ts` | CLI data submission endpoint |
| `app/api/sync/route.ts` | Legacy CLI sync endpoint |
| `app/api/leaderboard/route.ts` | Leaderboard data |
| `components/dashboard/` | Charts (heatmap, model usage, etc.) |
| `lib/pricing.ts` | Model pricing calculations |
| `lib/supabase/` | Supabase client & middleware |

### CLI Package (`packages/cli/`)

| File | Purpose |
|------|---------|
| `cli.ts` | Main CLI entry, Commander setup |
| `native.ts` | Native Rust module bindings |
| `cursor.ts` | Cursor API sync (fetch usage CSV) |
| `table.ts` | CLI table formatting |
| `spinner.ts` | Loading spinner UI |

### Native Core (`packages/core/`)

| File | Purpose |
|------|---------|
| `lib.rs` | NAPI exports, main entry point |
| `scanner.rs` | Parallel file system scanning |
| `aggregator.rs` | Aggregate messages by date |
| `sessions/opencode.rs` | OpenCode JSON parser |
| `sessions/claudecode.rs` | Claude Code JSONL parser |
| `sessions/codex.rs` | Codex JSON parser |
| `sessions/cursor.rs` | Cursor CSV parser |
| `sessions/gemini.rs` | Gemini JSON parser |
| `sessions/amp.rs` | Amp JSON parser |
| `sessions/droid.rs` | Droid JSON parser |
| `pricing/litellm.rs` | LiteLLM pricing API |
| `pricing/openrouter.rs` | OpenRouter pricing API |
| `pricing/lookup.rs` | Model pricing lookup with aliases |
| `pricing/cache.rs` | Disk cache for pricing data |

---

## Running the Project

### Prerequisites

- Node.js 22+ (for native module compatibility)
- Bun (CLI runtime)
- Rust 1.88+ (for native core compilation)
- pnpm (workspace manager)
- Supabase project (for database)
- GitHub OAuth app (for authentication)

### Environment Variables

Create `.env.vibetracking` with:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx  # For server-side operations
```

### Development

```bash
# Ensure Node.js 22+ is active (if using nvm)
nvm use 22

# Install dependencies
pnpm install

# Build native core (required first time)
cd packages/core && pnpm build

# Run the web app
pnpm dev              # Uses dotenvx to load .env.vibetracking

# CLI development (in packages/cli/)
cd packages/cli
bun run src/cli.ts models     # Show model usage report
bun run src/cli.ts submit     # Submit data to API
```

### Building the Native Core

```bash
cd packages/core

# Build for current platform
pnpm build

# Run tests
pnpm test
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

### 1. Native Core Tests (packages/core/)

```bash
cd packages/core
pnpm test    # Run AVA tests for native module
```

### 2. CLI Manual Testing

```bash
cd packages/cli

# Run CLI (opens browser with encoded data)
bun run src/cli.ts

# Cursor integration
bun run src/cli.ts cursor login
bun run src/cli.ts cursor logout
bun run src/cli.ts cursor status
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

---

## CLI Commands

### Main Commands

```bash
vibetracking                   # Scan data and open browser to import
vibetracking cursor login      # Login to Cursor (paste session token)
vibetracking cursor logout     # Logout from Cursor
vibetracking cursor status     # Check Cursor authentication status
```

### How It Works

1. Run `vibetracking` in your terminal
2. CLI scans local AI tool data (Claude Code, Codex, Gemini, Amp, Droid)
3. If Cursor credentials exist, fetches Cursor usage data
4. Opens browser to `/import#encoded_data`
5. User logs in with GitHub (if needed) and confirms import

### Cursor Integration

Cursor usage data is synced via API (requires session token):

```bash
# Login to Cursor (opens browser, prompts for token)
vibetracking cursor login

# Credentials stored in ~/.vibetracking/cursor-credentials.json
# Format: { "sessionToken": "eyJ...", "createdAt": "..." }
```

---

## API Routes

| Endpoint | Method | Purpose | Auth |
|----------|--------|---------|------|
| `/api/import` | POST | Browser-based data import | GitHub OAuth |
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
2. Test manually: `bun run src/cli.ts <command>`

### Native Core Changes

1. Modify Rust code in `packages/core/src/`
2. Rebuild: `cd packages/core && pnpm build`
3. Run tests: `pnpm test`
4. Test via CLI: `cd packages/cli && bun run src/cli.ts models`

### Adding a New AI Tool Parser

1. Create new parser in `packages/core/src/sessions/<tool>.rs`
2. Add to `sessions/mod.rs` exports
3. Update `scanner.rs` to scan new tool's file locations
4. Update `lib.rs` to include in parsing functions
5. Add tool to database constraints (migration)

---

## Key Files Reference

| File | What it does |
|------|--------------|
| `src/lib/pricing.ts` | Web app model pricing |
| `src/lib/utils.ts` | Number formatting, date utilities |
| `packages/core/src/pricing/lookup.rs` | Native pricing lookup with aliases |
| `packages/core/src/pricing/litellm.rs` | LiteLLM API pricing fetch |
| `packages/cli/src/native.ts` | Native module bindings |
| `packages/cli/src/credentials.ts` | Token storage |

---

## Troubleshooting

### Common Issues

1. **"Native module required" error**
   - Build the native core: `cd packages/core && pnpm build`
   - Ensure Rust 1.88+ is installed: `rustup update stable`

2. **"No data found" on submit**
   - Check if AI tools have created session files
   - Verify file paths in scanner.rs match your system

3. **Cursor sync failing**
   - Check ~/.vibetracking/cursor-credentials.json exists
   - Verify access token is still valid

4. **Database connection issues**
   - Verify `.env.vibetracking` has correct Supabase credentials
   - Check Supabase project is active

5. **E2E tests failing**
   - Ensure dev server is running on port 3000
   - Check Playwright MCP is available
   - Verify Bitwarden access token is configured

---

## Pricing Data Sources

The native core fetches pricing from two sources:

1. **LiteLLM** (`/model_prices/current_prices`)
   - Primary source for most models
   - Cached to `~/.cache/vibetracking/pricing-litellm.json`

2. **OpenRouter** (`/api/v1/models/{id}/endpoints`)
   - Fallback for OpenRouter-specific models
   - Fetches author pricing (direct from model provider)
   - Cached to `~/.cache/vibetracking/pricing-openrouter.json`

Cache TTL: 24 hours

---

## CLI Publishing (npm)

See the `publish-cli` skill for the full release workflow. Trigger terms: publish, release, npm, cli, version, tag.
