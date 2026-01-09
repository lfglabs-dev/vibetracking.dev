-- Vibetracking.dev Schema Update
-- Adds support for cache tokens, reasoning tokens, and new tool sources

-- Add cache and reasoning token columns to token_usage
ALTER TABLE public.token_usage
ADD COLUMN IF NOT EXISTS cache_read_tokens BIGINT DEFAULT 0,
ADD COLUMN IF NOT EXISTS cache_creation_tokens BIGINT DEFAULT 0,
ADD COLUMN IF NOT EXISTS reasoning_tokens BIGINT DEFAULT 0,
ADD COLUMN IF NOT EXISTS cost NUMERIC(12, 6) DEFAULT 0;

-- Add total cost to user_stats
ALTER TABLE public.user_stats
ADD COLUMN IF NOT EXISTS total_cost NUMERIC(12, 2) DEFAULT 0;

-- Add cost column to daily_activity
ALTER TABLE public.daily_activity
ADD COLUMN IF NOT EXISTS cost NUMERIC(12, 6) DEFAULT 0;

-- Update tool constraint to include all supported sources
-- First, drop the existing constraint
ALTER TABLE public.daily_activity DROP CONSTRAINT IF EXISTS daily_activity_tool_check;
ALTER TABLE public.token_usage DROP CONSTRAINT IF EXISTS token_usage_tool_check;

-- Add new constraint with all supported tools
ALTER TABLE public.daily_activity ADD CONSTRAINT daily_activity_tool_check
  CHECK (tool IN ('claude_code', 'codex', 'cursor', 'opencode', 'claude', 'gemini', 'amp', 'droid'));

ALTER TABLE public.token_usage ADD CONSTRAINT token_usage_tool_check
  CHECK (tool IN ('claude_code', 'codex', 'cursor', 'opencode', 'claude', 'gemini', 'amp', 'droid'));

-- Create index for cost-based leaderboard queries
CREATE INDEX IF NOT EXISTS idx_user_stats_cost ON public.user_stats(total_cost DESC);
