/**
 * Normalize model ID for consistent storage and aggregation.
 *
 * Transformations:
 * 1. Lowercase
 * 2. Strip date suffix: -YYYYMMDD
 * 3. Strip tier suffixes: -thinking, -high, -xhigh, -low, -medium, -free
 * 4. Normalize version: 4.5 -> 4-5
 * 5. Normalize Claude ordering: claude-4-sonnet -> claude-sonnet-4
 */

const DATE_SUFFIX = /-\d{8}$/;

const TIER_SUFFIXES = [
  "-high-thinking",
  "-thinking",
  "-xhigh",
  "-high",
  "-medium",
  "-low",
  "-free",
];

const PRESERVE_AS_IS = [
  "auto",
  "<synthetic>",
  "unknown",
  "cursor-small",
  "agent_review",
  "composer-1",
];

export function normalizeModelId(modelId: string): string {
  // Preserve special values
  if (PRESERVE_AS_IS.includes(modelId)) {
    return modelId;
  }

  let result = modelId.toLowerCase();

  // Strip date suffix (-YYYYMMDD)
  result = result.replace(DATE_SUFFIX, "");

  // Strip tier suffixes (may need multiple passes for stacked)
  for (let i = 0; i < 2; i++) {
    for (const suffix of TIER_SUFFIXES) {
      if (result.endsWith(suffix)) {
        result = result.slice(0, -suffix.length);
        break;
      }
    }
  }

  // Normalize version separators (X.Y -> X-Y, but not dates like 2024.11.20)
  // Only convert when surrounded by single digits
  result = result.replace(/(\d)\.(\d)(?!\d)/g, "$1-$2");

  // Normalize Claude ordering: claude-4-sonnet -> claude-sonnet-4
  // Handles: claude-4-sonnet, claude-4-5-opus, etc.
  const claudeMatch = result.match(
    /^claude-(\d+(?:-\d+)?)-?(opus|sonnet|haiku)$/
  );
  if (claudeMatch) {
    result = `claude-${claudeMatch[2]}-${claudeMatch[1]}`;
  }

  return result;
}
