-- Migration: cleanup_synthetic_models
-- Purpose: Remove synthetic/placeholder model entries with zero tokens from token_usage
-- These entries provide no value and clutter the model breakdown charts

-- Delete entries with excluded model names or zero tokens
DELETE FROM token_usage
WHERE
  -- Synthetic/placeholder model names
  model IN ('<synthetic>', 'auto', 'unknown', 'cursor-small', 'agent_review', 'composer-1')
  -- Or entries with zero tokens across all categories
  OR (
    input_tokens = 0
    AND output_tokens = 0
    AND cache_read_tokens = 0
    AND cache_creation_tokens = 0
    AND reasoning_tokens = 0
  );
