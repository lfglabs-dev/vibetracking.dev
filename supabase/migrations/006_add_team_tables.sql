-- Teams table - stores GitHub organization info
CREATE TABLE IF NOT EXISTS public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  github_org_id TEXT NOT NULL,
  github_org_login TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  avatar_url TEXT,
  description TEXT,
  created_by UUID NOT NULL REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Team memberships - links org members to vibetracking users
CREATE TABLE IF NOT EXISTS public.team_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  github_username TEXT NOT NULL,
  user_id UUID REFERENCES public.users(id),
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(team_id, github_username)
);

-- Aggregated team stats - computed from member data
CREATE TABLE IF NOT EXISTS public.team_stats (
  team_id UUID PRIMARY KEY REFERENCES public.teams(id) ON DELETE CASCADE,
  member_count INTEGER DEFAULT 0,
  active_member_count INTEGER DEFAULT 0,
  total_tokens BIGINT DEFAULT 0,
  total_cost NUMERIC DEFAULT 0,
  total_sessions INTEGER DEFAULT 0,
  favorite_model TEXT,
  favorite_tool TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_team_memberships_user_id ON public.team_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_team_memberships_team_id ON public.team_memberships(team_id);
CREATE INDEX IF NOT EXISTS idx_teams_github_org_login ON public.teams(github_org_login);

-- Enable RLS on all tables
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_stats ENABLE ROW LEVEL SECURITY;

-- Public read policies
CREATE POLICY "Teams are publicly readable" ON public.teams
  FOR SELECT USING (true);

CREATE POLICY "Team memberships are publicly readable" ON public.team_memberships
  FOR SELECT USING (true);

CREATE POLICY "Team stats are publicly readable" ON public.team_stats
  FOR SELECT USING (true);

-- Write policies for authenticated users (team admins)
CREATE POLICY "Team admins can update teams" ON public.teams
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.team_memberships
      WHERE team_id = teams.id
      AND user_id = auth.uid()
      AND role = 'admin'
    )
  );

CREATE POLICY "Team admins can manage memberships" ON public.team_memberships
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.team_memberships tm
      WHERE tm.team_id = team_memberships.team_id
      AND tm.user_id = auth.uid()
      AND tm.role = 'admin'
    )
  );

CREATE POLICY "Team admins can update stats" ON public.team_stats
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.team_memberships
      WHERE team_id = team_stats.team_id
      AND user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- Insert policies for authenticated users creating new teams
CREATE POLICY "Authenticated users can create teams" ON public.teams
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "System can insert team stats" ON public.team_stats
  FOR INSERT WITH CHECK (true);

CREATE POLICY "System can insert team memberships" ON public.team_memberships
  FOR INSERT WITH CHECK (true);
