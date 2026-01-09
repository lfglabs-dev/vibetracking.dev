/**
 * Format model name for display
 * Converts model IDs like "claude-sonnet-4-20250514" to "Claude Sonnet 4"
 */

// Known model name mappings for cleaner display
const MODEL_NAME_MAP: Record<string, string> = {
  // Claude 4.5 models
  "claude-opus-4-5-20251101": "Claude Opus 4.5",
  "claude-sonnet-4-5-20250929": "Claude Sonnet 4.5",
  "claude-haiku-4-5-20251001": "Claude Haiku 4.5",
  // Claude 4 models
  "claude-sonnet-4-20250514": "Claude Sonnet 4",
  "claude-opus-4-20250514": "Claude Opus 4",
  "claude-4-sonnet": "Claude 4 Sonnet",
  "claude-4-sonnet-thinking": "Claude 4 Sonnet",
  "claude-4.5-opus-high-thinking": "Claude 4.5 Opus",
  "claude-4.5-sonnet-thinking": "Claude 4.5 Sonnet",
  // Claude 3.x models
  "claude-haiku-3-5-20241022": "Claude Haiku 3.5",
  "claude-3-5-sonnet-20241022": "Claude 3.5 Sonnet",
  "claude-3-5-haiku-20241022": "Claude 3.5 Haiku",
  "claude-3-opus-20240229": "Claude 3 Opus",
  "claude-3-sonnet-20240229": "Claude 3 Sonnet",
  "claude-3-haiku-20240307": "Claude 3 Haiku",
  "claude-3.5-sonnet": "Claude 3.5 Sonnet",
  "claude-3.7-sonnet": "Claude 3.7 Sonnet",
  // OpenAI GPT models
  "gpt-4o": "GPT-4o",
  "gpt-4o-mini": "GPT-4o Mini",
  "gpt-4-turbo": "GPT-4 Turbo",
  "gpt-4": "GPT-4",
  "gpt-4.1": "GPT-4.1",
  "gpt-3.5-turbo": "GPT-3.5 Turbo",
  // OpenAI GPT-5.x models
  "gpt-5": "GPT-5",
  "gpt-5.1": "GPT-5.1",
  "gpt-5.2": "GPT-5.2",
  "gpt-5.2-codex": "GPT-5.2 Codex",
  "gpt-5-codex": "GPT-5 Codex",
  "gpt-5-high": "GPT-5 High",
  "gpt-5-2025-08-07": "GPT-5",
  // OpenAI o-series
  "o3": "o3",
  "o3-mini": "o3-mini",
  "o4-mini": "o4-mini",
  "o1": "o1",
  "o1-mini": "o1-mini",
  "o1-preview": "o1-preview",
  // Google Gemini models
  "gemini-3-flash-preview": "Gemini 3 Flash",
  "gemini-3-pro-preview": "Gemini 3 Pro",
  "gemini-2.5-pro-exp-03-25": "Gemini 2.5 Pro",
  "gemini-2.5-pro-preview-05-06": "Gemini 2.5 Pro",
};

export function formatModelName(model: string): string {
  // Check if we have a direct mapping
  if (MODEL_NAME_MAP[model]) {
    return MODEL_NAME_MAP[model];
  }

  // Fallback: clean up the model name
  return model
    .replace(/^claude-/, "Claude ")
    .replace(/^gpt-/, "GPT-")
    .replace(/-(\d{8})$/, "") // Remove date suffix like -20250514
    .replace(/-/g, " ")
    .split(" ")
    .map((word) => {
      // Keep numbers and already capitalized words as-is
      if (/^\d+/.test(word) || /^[A-Z]/.test(word)) {
        return word;
      }
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ")
    .trim();
}
