-- Drop sync_tokens table and related objects
-- This table was used for CLI authentication which is now removed
-- in favor of browser-only import flow

DROP POLICY IF EXISTS "Users can manage their sync tokens" ON sync_tokens;
DROP INDEX IF EXISTS idx_sync_tokens_token;
DROP TABLE IF EXISTS sync_tokens;
