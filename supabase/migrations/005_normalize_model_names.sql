-- Migration: normalize_model_names
-- Purpose: Consolidate duplicate model entries caused by naming variations
--
-- Normalization rules (matching TypeScript normalizeModelId):
-- 1. Lowercase
-- 2. Strip date suffix: -YYYYMMDD
-- 3. Strip tier suffixes: -thinking, -high, -xhigh, -low, -medium, -free
-- 4. Normalize version: 4.5 -> 4-5
-- 5. Normalize Claude ordering: claude-4-sonnet -> claude-sonnet-4

-- Create a function to normalize model IDs (matching TypeScript logic)
CREATE OR REPLACE FUNCTION normalize_model_id(model_id TEXT)
RETURNS TEXT AS $$
DECLARE
  result TEXT;
  preserve_list TEXT[] := ARRAY['auto', '<synthetic>', 'unknown', 'cursor-small', 'agent_review', 'composer-1'];
  version_part TEXT;
  tier_part TEXT;
BEGIN
  -- Preserve special values
  IF model_id = ANY(preserve_list) THEN
    RETURN model_id;
  END IF;

  -- Step 1: Lowercase
  result := lower(model_id);

  -- Step 2: Strip date suffix (-YYYYMMDD)
  result := regexp_replace(result, '-\d{8}$', '');

  -- Step 3: Strip tier suffixes (order matters: longest first)
  -- May need multiple passes for stacked suffixes like -high-thinking
  result := regexp_replace(result, '-(high-thinking|thinking|xhigh|high|medium|low|free)$', '');
  result := regexp_replace(result, '-(high-thinking|thinking|xhigh|high|medium|low|free)$', '');

  -- Step 4: Normalize version separators (X.Y -> X-Y)
  -- Only convert single digit pairs, not dates like 2024.11.20
  result := regexp_replace(result, '(\d)\.(\d)(?!\d)', '\1-\2', 'g');

  -- Step 5: Normalize Claude ordering: claude-X-Y-tier -> claude-tier-X-Y
  -- Handles: claude-4-opus, claude-4-5-opus, claude-4-5-sonnet, etc.
  IF result ~ '^claude-\d+(-\d+)?-(opus|sonnet|haiku)$' THEN
    -- Extract version and tier parts
    version_part := substring(result from '^claude-(\d+(?:-\d+)?)-(opus|sonnet|haiku)$' for '#1');
    tier_part := substring(result from '^claude-\d+(?:-\d+)?-(opus|sonnet|haiku)$' for '#1');

    -- Use simpler regex replacement
    result := regexp_replace(result, '^claude-(\d+(?:-\d+)?)-(opus|sonnet|haiku)$', 'claude-\2-\1');
  END IF;

  RETURN result;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Step 1: Create temp table with aggregated normalized data
CREATE TEMP TABLE token_usage_normalized AS
SELECT
  user_id,
  date,
  tool,
  normalize_model_id(model) as model,
  SUM(input_tokens) as input_tokens,
  SUM(output_tokens) as output_tokens,
  SUM(COALESCE(cache_read_tokens, 0)) as cache_read_tokens,
  SUM(COALESCE(cache_creation_tokens, 0)) as cache_creation_tokens,
  SUM(COALESCE(reasoning_tokens, 0)) as reasoning_tokens,
  SUM(COALESCE(cost, 0)) as cost
FROM token_usage
GROUP BY user_id, date, tool, normalize_model_id(model);

-- Step 2: Replace token_usage with normalized data
DELETE FROM token_usage;

INSERT INTO token_usage (
  user_id, date, tool, model,
  input_tokens, output_tokens, cache_read_tokens,
  cache_creation_tokens, reasoning_tokens, cost
)
SELECT * FROM token_usage_normalized;

-- Step 3: Update favorite_model in user_stats
UPDATE user_stats
SET favorite_model = normalize_model_id(favorite_model)
WHERE favorite_model IS NOT NULL;

-- Cleanup
DROP TABLE token_usage_normalized;

-- Note: The normalize_model_id function is kept for future use if needed
-- To drop it: DROP FUNCTION normalize_model_id(TEXT);
