# Vibetracking.dev

Track and visualize your AI coding tool usage across Claude Code, Codex, Cursor, Gemini, OpenCode, Amp, and Factory Droid.

**Live site:** https://vibetracking.dev

## What is Vibetracking?

Vibetracking aggregates usage statistics from AI coding assistants and presents them in a gamified interface with:

- **Global leaderboards** ranked by estimated API spending
- **Personal dashboards** with activity heatmaps
- **Model usage breakdowns** and charts
- **Fun comparisons** (tokens = novels, marathons, etc.)
- **Streak tracking** and achievement badges

## Quick Start

```bash
# Run the CLI to scan your local AI tool data and open your dashboard
bunx vibetracking
```

This scans your local machine for AI coding tool data, compresses it, and opens your browser to import the data to vibetracking.dev.

---

## Project Structure

```
vibetracking/
├── src/                    # Next.js web application
│   ├── app/               # App Router pages & API routes
│   ├── components/        # React components
│   ├── lib/               # Utilities & Supabase client
│   └── middleware.ts      # URL rewriting (/@user → /user/user)
├── packages/
│   ├── cli/               # Bun-based CLI tool
│   │   └── src/
│   │       ├── cli.ts     # Main CLI entry
│   │       ├── cursor.ts  # Cursor IDE integration
│   │       └── ...
│   └── core/              # Native Rust module (NAPI-RS)
│       └── src/
│           ├── parser.rs  # Session file parsers
│           ├── pricing/   # Model pricing lookup
│           └── sessions/  # Tool-specific parsers
├── supabase/migrations/   # Database schema
└── public/                # Static assets
```

## Tech Stack

| Component | Technology |
|-----------|------------|
| **Web Framework** | Next.js 16 + React 19 |
| **Database** | Supabase (PostgreSQL) |
| **Authentication** | GitHub OAuth via Supabase Auth |
| **Styling** | Tailwind CSS v4 |
| **Charts** | Recharts v3 |
| **CLI Runtime** | Bun |
| **Native Parsing** | Rust (NAPI-RS) |
| **Deployment** | Vercel |

---

## Development Setup

### Prerequisites

- **Bun** >= 1.0 (runtime and package manager)
- **Node.js** >= 22 (required for native module build)
- **Rust** (for building the native core module)
- **Supabase** account (for database)
- **GitHub OAuth app** (for authentication)

### 1. Clone and Install Dependencies

```bash
git clone https://github.com/lfglabs/vibetracking.git
cd vibetracking
bun install
```

### 2. Environment Configuration

The project uses [dotenvx](https://dotenvx.com/) for encrypted environment variables.

**For development with the existing encrypted `.env.vibetracking`:**

```bash
# The file is already encrypted. dotenvx will decrypt it at runtime
# if you have the DOTENV_PRIVATE_KEY set
bun dev
```

**To create your own environment file:**

Create `.env.vibetracking` with:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Supabase Service Role (server-side only - keep secret!)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Optional: Custom application URL (defaults to https://vibetracking.dev)
VIBETRACKING_URL=http://localhost:3000
```

### 3. Build the Native Core Module

The CLI uses a native Rust module for high-performance parsing:

```bash
cd packages/core
bun run build
```

### 4. Set Up Supabase Database

1. Create a new Supabase project
2. Run the migrations in the SQL Editor:

```bash
# Apply the schema
cat supabase/migrations/001_initial_schema.sql | pbcopy
# Paste into Supabase SQL Editor and run
```

3. Configure GitHub OAuth:
   - Go to Supabase Dashboard → Authentication → Providers → GitHub
   - Create a GitHub OAuth app at https://github.com/settings/developers
   - Add the callback URL: `https://your-project.supabase.co/auth/v1/callback`

### 5. Run the Development Server

```bash
# Start the Next.js dev server
bun dev

# Server runs at http://localhost:3000
```

### 6. Run the CLI Locally

```bash
cd packages/cli

# Run directly with Bun
bun run src/cli.ts

# Or build and run
bun run build
bun run dist/cli.js
```

---

## Data Flow

```
┌─────────────────────────────┐
│      Local Machine          │
├─────────────────────────────┤
│ Claude:   ~/.claude/projects/
│ OpenCode: ~/.local/share/opencode/
│ Codex:    ~/.codex/
│ Cursor:   Browser CSV download
│ Gemini:   ~/.gemini/
│ Amp:      ~/.amp/
│ Droid:    ~/.droid/
└───────────────┬─────────────┘
                │
                ▼
┌─────────────────────────────┐
│   CLI (bunx vibetracking)   │
├─────────────────────────────┤
│ 1. Parse tool data files    │
│    (via Rust native module) │
│ 2. Aggregate statistics     │
│ 3. Compress (gzip+base64url)│
└───────────────┬─────────────┘
                │
                │
                ▼
┌─────────────────────────────┐
│    Browser Import           │
│    /import#encoded_data     │
│    (GitHub OAuth login)     │
└───────────────┬─────────────┘
                │
                ▼
┌─────────────────────────────┐
│   Supabase (PostgreSQL)     │
├─────────────────────────────┤
│ users, daily_activity,      │
│ token_usage, user_stats     │
└─────────────────────────────┘
```

---

## CLI Commands

### Basic Usage

```bash
# Scan tools and open browser with your data
bunx vibetracking
```

The CLI scans local AI coding tool data and opens your browser to import it via GitHub OAuth.

### Cursor IDE Integration

If Cursor is installed, the CLI will:

1. Open your browser to download usage data from cursor.com
2. Detect the downloaded CSV automatically
3. Import it alongside your other AI tool data

If auto-detection fails, you can drag-and-drop the CSV file into the terminal.

---

## Database Schema

### Tables

| Table | Purpose |
|-------|---------|
| `users` | User profiles (GitHub or anonymous) |
| `daily_activity` | Daily stats per tool for heatmap |
| `token_usage` | Token breakdown by model |
| `user_stats` | Aggregated statistics |

### Security

- Row Level Security (RLS) enabled on all tables
- Public read access for profiles and stats
- Write access restricted to authenticated users (own data)

---

## API Routes

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/import` | POST | Browser-based data import |
| `/api/leaderboard` | GET | Get leaderboard data |
| `/og/user/[username]` | GET | Open Graph images |
| `/auth/callback` | GET | GitHub OAuth callback |

---

## Testing

### Core Module Tests

The native Rust module must be built before running tests:

```bash
cd packages/core
bun run build        # Build the native module first (requires Rust)
bun run test:rust    # Rust unit tests (no build required)
bun run test         # Node.js integration tests (requires build)
bun run test:all     # Run both
```

### CLI Manual Testing

```bash
cd packages/cli
bun run src/cli.ts              # Scan data and open browser
```

### Web Application

```bash
bun dev                        # Start dev server at localhost:3000
```

---

## Deployment

### Vercel (Automatic)

The repo is connected to Vercel for automatic deployments:

- **Production**: https://vibetracking.dev (deploys from `main`)
- **Preview**: Automatic deployments for all branches/PRs

### Environment Variables (Vercel)

Set these in the Vercel dashboard:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `VIBETRACKING_URL`

---

## Publishing the CLI

The CLI is published to npm as `vibetracking`:

```bash
cd packages/cli
bun run build
npm publish
```

The core native module is published as `@starknetid/vibetracking-core`:

```bash
cd packages/core
bun run build
npm publish
```

---

## Troubleshooting

### "No data found" on import page

- Ensure the URL has `#encoded-data` hash
- Run `bunx vibetracking` to generate fresh data

### CLI can't find tool data

- **Claude Code**: Check `~/.claude/projects/` exists
- **OpenCode**: Check `~/.local/share/opencode/` exists
- **Codex**: Check `~/.codex/` exists
- **Cursor**: Make sure you're logged into cursor.com in your browser

### Native module build fails

```bash
# Ensure Rust is installed
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Rebuild
cd packages/core
bun run build
```

### Database connection issues

- Verify `.env.vibetracking` has correct Supabase credentials
- Check Supabase project is active and not paused

---

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

MIT
