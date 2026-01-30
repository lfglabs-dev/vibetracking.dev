-- Add openclaw as a valid tool in daily_activity and token_usage tables

-- Drop existing constraints
ALTER TABLE public.daily_activity DROP CONSTRAINT IF EXISTS daily_activity_tool_check;
ALTER TABLE public.token_usage DROP CONSTRAINT IF EXISTS token_usage_tool_check;

-- Add new constraints with openclaw included
ALTER TABLE public.daily_activity ADD CONSTRAINT daily_activity_tool_check
  CHECK (tool IN ('claude_code', 'codex', 'cursor', 'opencode', 'claude', 'gemini', 'amp', 'droid', 'openclaw'));

ALTER TABLE public.token_usage ADD CONSTRAINT token_usage_tool_check
  CHECK (tool IN ('claude_code', 'codex', 'cursor', 'opencode', 'claude', 'gemini', 'amp', 'droid', 'openclaw'));
