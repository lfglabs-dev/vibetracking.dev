-- Fixup migration: Clean up team privacy policies
-- Migration 007 had incorrect policy names in DROP statements, leaving old permissive policies active

-- Drop the old permissive SELECT policies that should have been removed
DROP POLICY IF EXISTS "Teams are publicly readable" ON teams;
DROP POLICY IF EXISTS "Team stats are publicly readable" ON team_stats;
DROP POLICY IF EXISTS "Team memberships are publicly readable" ON team_memberships;

-- Drop and recreate the restrictive policies (in case they already exist from previous run)
DROP POLICY IF EXISTS "Teams are viewable by members or if public" ON teams;
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

DROP POLICY IF EXISTS "Team stats are viewable by members or if public" ON team_stats;
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

DROP POLICY IF EXISTS "Team memberships are viewable by members or if public" ON team_memberships;
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
