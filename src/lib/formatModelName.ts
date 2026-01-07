/**
 * Format model name for display
 * Converts model IDs like "claude-sonnet-4-20250514" to "Claude Sonnet 4"
 */

// Known model name mappings for cleaner display
const MODEL_NAME_MAP: Record<string, string> = {
  // Claude models
  "claude-sonnet-4-20250514": "Claude Sonnet 4",
  "claude-opus-4-20250514": "Claude Opus 4",
  "claude-haiku-3-5-20241022": "Claude Haiku 3.5",
  "claude-3-5-sonnet-20241022": "Claude 3.5 Sonnet",
  "claude-3-5-haiku-20241022": "Claude 3.5 Haiku",
  "claude-3-opus-20240229": "Claude 3 Opus",
  "claude-3-sonnet-20240229": "Claude 3 Sonnet",
  "claude-3-haiku-20240307": "Claude 3 Haiku",
  // OpenAI models
  "gpt-4o": "GPT-4o",
  "gpt-4o-mini": "GPT-4o Mini",
  "gpt-4-turbo": "GPT-4 Turbo",
  "gpt-4": "GPT-4",
  "gpt-3.5-turbo": "GPT-3.5 Turbo",
  "o3-mini": "o3-mini",
  "o1": "o1",
  "o1-mini": "o1-mini",
  "o1-preview": "o1-preview",
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
