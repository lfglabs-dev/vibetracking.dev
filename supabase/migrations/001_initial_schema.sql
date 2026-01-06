-- Vibetracking.dev Database Schema
-- Run this in Supabase SQL Editor

-- Users table
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  github_id TEXT UNIQUE,
  username TEXT NOT NULL UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  company TEXT,
  is_anonymous BOOLEAN DEFAULT true,
  anonymous_id TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Daily activity for heatmap
CREATE TABLE IF NOT EXISTS public.daily_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  tool TEXT NOT NULL CHECK (tool IN ('claude_code', 'codex', 'cursor')),
  message_count INTEGER DEFAULT 0,
  session_count INTEGER DEFAULT 0,
  total_tokens BIGINT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date, tool)
);

-- Token usage by model
CREATE TABLE IF NOT EXISTS public.token_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  tool TEXT NOT NULL CHECK (tool IN ('claude_code', 'codex', 'cursor')),
  model TEXT NOT NULL,
  input_tokens BIGINT DEFAULT 0,
  output_tokens BIGINT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User stats (aggregated, computed on import)
CREATE TABLE IF NOT EXISTS public.user_stats (
  user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  total_tokens BIGINT DEFAULT 0,
  total_sessions INTEGER DEFAULT 0,
  favorite_model TEXT,
  favorite_tool TEXT,
  longest_session_ms BIGINT DEFAULT 0,
  longest_streak_days INTEGER DEFAULT 0,
  current_streak_days INTEGER DEFAULT 0,
  first_activity_date DATE,
  last_activity_date DATE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sync tokens for CLI re-sync
CREATE TABLE IF NOT EXISTS public.sync_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_daily_activity_user_date ON public.daily_activity(user_id, date);
CREATE INDEX IF NOT EXISTS idx_daily_activity_date ON public.daily_activity(date);
CREATE INDEX IF NOT EXISTS idx_token_usage_user ON public.token_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_token_usage_model ON public.token_usage(model);
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);
CREATE INDEX IF NOT EXISTS idx_users_anonymous_id ON public.users(anonymous_id);
CREATE INDEX IF NOT EXISTS idx_user_stats_tokens ON public.user_stats(total_tokens DESC);
CREATE INDEX IF NOT EXISTS idx_sync_tokens_token ON public.sync_tokens(token);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.token_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_tokens ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users: Public read, authenticated user can update own
CREATE POLICY "Users are publicly readable" ON public.users
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Service role can insert users" ON public.users
  FOR INSERT WITH CHECK (true);

-- Daily activity: Public read, only owner can modify
CREATE POLICY "Daily activity is publicly readable" ON public.daily_activity
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own daily activity" ON public.daily_activity
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own daily activity" ON public.daily_activity
  FOR UPDATE USING (auth.uid() = user_id);

-- Token usage: Public read, only owner can modify
CREATE POLICY "Token usage is publicly readable" ON public.token_usage
  FOR SELECT USING (true);

CREATE POLICY "Users can insert own token usage" ON public.token_usage
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User stats: Public read, only owner can modify
CREATE POLICY "User stats are publicly readable" ON public.user_stats
  FOR SELECT USING (true);

CREATE POLICY "Users can upsert own stats" ON public.user_stats
  FOR ALL USING (auth.uid() = user_id);

-- Sync tokens: Private, only owner can access
CREATE POLICY "Users can manage own sync tokens" ON public.sync_tokens
  FOR ALL USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER set_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_user_stats_updated_at
  BEFORE UPDATE ON public.user_stats
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
