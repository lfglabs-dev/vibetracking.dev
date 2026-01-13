-- Add is_public column to teams table (default false for privacy)
ALTER TABLE teams ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false;

-- Update RLS policy to allow viewing teams if user is a member OR team is public
DROP POLICY IF EXISTS "Teams are publicly readable" ON teams;
CREATE POLICY "Teams are viewable by members or if public" ON teams
  FOR SELECT
  USING (
    is_public = true
    OR created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM team_memberships
      WHERE team_memberships.team_id = teams.id
      AND team_memberships.user_id = auth.uid()
    )
  );

-- Update team_stats policy similarly
DROP POLICY IF EXISTS "Team stats are publicly readable" ON team_stats;
CREATE POLICY "Team stats are viewable by members or if public" ON team_stats
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM teams
      WHERE teams.id = team_stats.team_id
      AND (
        teams.is_public = true
        OR teams.created_by = auth.uid()
        OR EXISTS (
          SELECT 1 FROM team_memberships
          WHERE team_memberships.team_id = teams.id
          AND team_memberships.user_id = auth.uid()
        )
      )
    )
  );

-- Update team_memberships policy similarly
DROP POLICY IF EXISTS "Team memberships are publicly readable" ON team_memberships;
CREATE POLICY "Team memberships are viewable by members or if public" ON team_memberships
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM teams
      WHERE teams.id = team_memberships.team_id
      AND (
        teams.is_public = true
        OR teams.created_by = auth.uid()
        OR EXISTS (
          SELECT 1 FROM team_memberships tm
          WHERE tm.team_id = teams.id
          AND tm.user_id = auth.uid()
        )
      )
    )
  );
