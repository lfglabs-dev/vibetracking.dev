# vibetracking.dev

An app to track your vibe coding productivity with AI coding tools like Claude Code, Codex, and Cursor.

## Deployment

This repo is connected to **Vercel** for automatic deployments:

- **Production**: https://vibetracking.dev (deploys from `main` branch)
- **Preview**: Automatic preview deployments for all branches/PRs
- **Vercel Project**: `lfglabs/vibetracking.dev`
- **Dashboard**: https://vercel.com/lfglabs/vibetracking.dev

### Environment Variables

Environment variables are configured in Vercel dashboard for both Production and Preview environments:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `VIBETRACKING_URL`

For local development, use `dotenvx` with `.env.vibetracking` (encrypted).

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: Supabase (PostgreSQL)
- **Package Manager**: bun (also compatible with pnpm)
- **Styling**: Tailwind CSS
- **Deployment**: Vercel

## Development

```bash
# Install dependencies
bun install

# Run development server
bun dev

# Build for production
bun run build
```

## Project Structure

- `src/app/` - Next.js App Router pages and API routes
- `src/components/` - React components
- `src/lib/` - Utility functions and shared logic
- `packages/cli/` - CLI tool for syncing stats
