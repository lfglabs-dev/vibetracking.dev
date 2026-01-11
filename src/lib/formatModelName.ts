/**
 * Format model name for display
 * Converts normalized model IDs to human-readable names
 *
 * Input IDs are already normalized (e.g., "claude-sonnet-4-5" not "claude-sonnet-4-5-20250929")
 */

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// Pattern-based display formatting for normalized model IDs
const DISPLAY_PATTERNS: Array<{
  pattern: RegExp;
  format: (match: RegExpMatchArray) => string;
}> = [
  // Claude: claude-{tier}-{version} -> Claude {Tier} {version}
  {
    pattern: /^claude-(opus|sonnet|haiku)-(\d+(?:-\d+)?)$/,
    format: (m) => `Claude ${capitalize(m[1])} ${m[2].replace("-", ".")}`,
  },
  // GPT with version: gpt-{version} -> GPT-{version}
  {
    pattern: /^gpt-(\d+(?:\.\d+)?(?:o)?(?:-\w+)?)$/,
    format: (m) => `GPT-${m[1]}`,
  },
  // GPT with suffix: gpt-{version}-{suffix} -> GPT-{version} {Suffix}
  {
    pattern: /^gpt-(\d+(?:\.\d+)?)-(\w+)$/,
    format: (m) => `GPT-${m[1]} ${capitalize(m[2])}`,
  },
  // Gemini: gemini-{version}-{tier} -> Gemini {version} {Tier}
  {
    pattern: /^gemini-(\d+(?:-\d+)?)-(\w+)(?:-\w+)?$/,
    format: (m) => `Gemini ${m[1].replace("-", ".")} ${capitalize(m[2])}`,
  },
  // o-series: o{version} -> o{version}
  {
    pattern: /^o(\d+)(-\w+)?$/,
    format: (m) => `o${m[1]}${m[2] || ""}`,
  },
];

// Known model name mappings for edge cases and backwards compatibility
const MODEL_NAME_MAP: Record<string, string> = {
  // Special/synthetic models
  auto: "Auto",
  "<synthetic>": "Synthetic",
  unknown: "Unknown",
  "cursor-small": "Cursor Small",
  agent_review: "Agent Review",
  "composer-1": "Composer",
  // GPT-4o variants (don't match simple pattern)
  "gpt-4o": "GPT-4o",
  "gpt-4o-mini": "GPT-4o Mini",
};

export function formatModelName(model: string): string {
  // Check if we have a direct mapping
  if (MODEL_NAME_MAP[model]) {
    return MODEL_NAME_MAP[model];
  }

  // Try pattern-based formatting
  for (const { pattern, format } of DISPLAY_PATTERNS) {
    const match = model.match(pattern);
    if (match) {
      return format(match);
    }
  }

  // Fallback: basic cleanup
  return model
    .split("-")
    .map((word) => {
      // Keep numbers and already capitalized words as-is
      if (/^\d+/.test(word) || /^[A-Z]/.test(word)) {
        return word;
      }
      return capitalize(word);
    })
    .join(" ");
}
