export type ModelPricing = {
  inputPerMTok: number;
  outputPerMTok: number;
};

export const DEFAULT_INPUT_FRACTION = 0.7;

const PRICING_BY_MODEL: Record<string, ModelPricing> = {
  // ===================
  // OpenAI Models
  // ===================
  // GPT-5.x series
  "gpt-5.2": { inputPerMTok: 1.75, outputPerMTok: 14.0 },
  "gpt-5.2-pro": { inputPerMTok: 21.0, outputPerMTok: 168.0 },
  "gpt-5.1": { inputPerMTok: 1.25, outputPerMTok: 10.0 },
  "gpt-5": { inputPerMTok: 1.25, outputPerMTok: 10.0 },
  "gpt-5-pro": { inputPerMTok: 15.0, outputPerMTok: 120.0 },
  "gpt-5-mini": { inputPerMTok: 0.25, outputPerMTok: 2.0 },
  "gpt-5-nano": { inputPerMTok: 0.05, outputPerMTok: 0.4 },
  // GPT-4.1 series
  "gpt-4.1": { inputPerMTok: 2.0, outputPerMTok: 8.0 },
  "gpt-4.1-mini": { inputPerMTok: 0.4, outputPerMTok: 1.6 },
  "gpt-4.1-nano": { inputPerMTok: 0.1, outputPerMTok: 0.4 },
  // GPT-4o series
  "gpt-4o": { inputPerMTok: 2.5, outputPerMTok: 10.0 },
  "gpt-4o-2024-05-13": { inputPerMTok: 5.0, outputPerMTok: 15.0 },
  "gpt-4o-mini": { inputPerMTok: 0.15, outputPerMTok: 0.6 },
  "chatgpt-4o-latest": { inputPerMTok: 5.0, outputPerMTok: 15.0 },
  // GPT-4 series
  "gpt-4-turbo": { inputPerMTok: 10.0, outputPerMTok: 30.0 },
  "gpt-4": { inputPerMTok: 30.0, outputPerMTok: 60.0 },
  "gpt-4-32k": { inputPerMTok: 60.0, outputPerMTok: 120.0 },
  "gpt-3.5-turbo": { inputPerMTok: 0.5, outputPerMTok: 1.5 },
  // OpenAI Reasoning Models (o-series)
  o1: { inputPerMTok: 15.0, outputPerMTok: 60.0 },
  "o1-mini": { inputPerMTok: 1.1, outputPerMTok: 4.4 },
  "o1-pro": { inputPerMTok: 150.0, outputPerMTok: 600.0 },
  o3: { inputPerMTok: 2.0, outputPerMTok: 8.0 },
  "o3-mini": { inputPerMTok: 1.1, outputPerMTok: 4.4 },
  "o3-pro": { inputPerMTok: 20.0, outputPerMTok: 80.0 },
  "o3-deep-research": { inputPerMTok: 10.0, outputPerMTok: 40.0 },
  "o4-mini": { inputPerMTok: 1.1, outputPerMTok: 4.4 },
  "o4-mini-deep-research": { inputPerMTok: 2.0, outputPerMTok: 8.0 },

  // ===================
  // Anthropic Claude Models
  // ===================
  // Claude 4.5 series (latest - corrected pricing)
  "claude-opus-4.5": { inputPerMTok: 5.0, outputPerMTok: 25.0 },
  "claude-sonnet-4.5": { inputPerMTok: 3.0, outputPerMTok: 15.0 },
  "claude-haiku-4.5": { inputPerMTok: 1.0, outputPerMTok: 5.0 },
  // Claude 4 series (corrected: Opus 4 now $5/$25, same as 4.5)
  "claude-opus-4": { inputPerMTok: 5.0, outputPerMTok: 25.0 },
  "claude-sonnet-4": { inputPerMTok: 3.0, outputPerMTok: 15.0 },
  // Claude 3.x series
  "claude-sonnet-3.7": { inputPerMTok: 3.0, outputPerMTok: 15.0 },
  "claude-sonnet-3.5": { inputPerMTok: 3.0, outputPerMTok: 15.0 },
  "claude-opus-3": { inputPerMTok: 15.0, outputPerMTok: 75.0 },
  "claude-haiku-3.5": { inputPerMTok: 0.8, outputPerMTok: 4.0 },
  "claude-haiku-3": { inputPerMTok: 0.25, outputPerMTok: 1.25 },

  // ===================
  // Google Gemini Models
  // ===================
  // Gemini 3 series
  "gemini-3-pro": { inputPerMTok: 2.0, outputPerMTok: 12.0 },
  "gemini-3-flash": { inputPerMTok: 0.5, outputPerMTok: 3.0 },
  // Gemini 2.5 series
  "gemini-2.5-pro": { inputPerMTok: 1.25, outputPerMTok: 10.0 },
  "gemini-2.5-flash": { inputPerMTok: 0.3, outputPerMTok: 2.5 },
  "gemini-2.5-flash-lite": { inputPerMTok: 0.1, outputPerMTok: 0.4 },
  // Gemini 2.0 series
  "gemini-2.0-pro": { inputPerMTok: 1.25, outputPerMTok: 10.0 },
  "gemini-2.0-flash": { inputPerMTok: 0.1, outputPerMTok: 0.4 },
  "gemini-2.0-flash-lite": { inputPerMTok: 0.1, outputPerMTok: 0.4 },
  // Gemini 1.5 series (legacy)
  "gemini-1.5-pro": { inputPerMTok: 1.25, outputPerMTok: 5.0 },
  "gemini-1.5-flash": { inputPerMTok: 0.075, outputPerMTok: 0.3 },

  // ===================
  // xAI Grok Models
  // ===================
  "grok-4": { inputPerMTok: 3.0, outputPerMTok: 15.0 },
  "grok-4.1-fast": { inputPerMTok: 0.2, outputPerMTok: 0.5 },
  "grok-3": { inputPerMTok: 3.0, outputPerMTok: 15.0 },
  "grok-2": { inputPerMTok: 2.0, outputPerMTok: 10.0 },
  "grok-2-vision": { inputPerMTok: 2.0, outputPerMTok: 10.0 },

  // ===================
  // Mistral AI Models
  // ===================
  "mistral-large-3": { inputPerMTok: 0.5, outputPerMTok: 1.5 },
  "mistral-large-2": { inputPerMTok: 2.0, outputPerMTok: 6.0 },
  "mistral-large": { inputPerMTok: 2.0, outputPerMTok: 6.0 },
  "mistral-medium-3.1": { inputPerMTok: 0.4, outputPerMTok: 2.0 },
  "mistral-medium-3": { inputPerMTok: 0.4, outputPerMTok: 2.0 },
  "mistral-medium": { inputPerMTok: 0.4, outputPerMTok: 2.0 },
  "mistral-small": { inputPerMTok: 0.1, outputPerMTok: 0.3 },
  "ministral-3b": { inputPerMTok: 0.1, outputPerMTok: 0.1 },
  "ministral-8b": { inputPerMTok: 0.15, outputPerMTok: 0.15 },
  "ministral-14b": { inputPerMTok: 0.2, outputPerMTok: 0.2 },
  codestral: { inputPerMTok: 0.3, outputPerMTok: 0.9 },
  "mixtral-8x7b": { inputPerMTok: 0.7, outputPerMTok: 0.7 },

  // ===================
  // DeepSeek Models
  // ===================
  "deepseek-v3": { inputPerMTok: 0.27, outputPerMTok: 1.1 },
  "deepseek-chat": { inputPerMTok: 0.27, outputPerMTok: 1.1 },
  "deepseek-r1": { inputPerMTok: 0.56, outputPerMTok: 1.68 },
  "deepseek-reasoner": { inputPerMTok: 0.56, outputPerMTok: 1.68 },

  // ===================
  // Meta Llama Models
  // ===================
  "llama-4-scout": { inputPerMTok: 0.15, outputPerMTok: 0.5 },
  "llama-4-maverick": { inputPerMTok: 0.22, outputPerMTok: 0.85 },
  "llama-3.3-70b": { inputPerMTok: 0.59, outputPerMTok: 0.79 },
  "llama-3.1-405b": { inputPerMTok: 3.0, outputPerMTok: 3.0 },
  "llama-3.1-70b": { inputPerMTok: 0.59, outputPerMTok: 0.79 },
  "llama-3.1-8b": { inputPerMTok: 0.03, outputPerMTok: 0.05 },

  // ===================
  // Alibaba Qwen Models
  // ===================
  "qwen-2.5-max": { inputPerMTok: 1.6, outputPerMTok: 6.4 },
  "qwen-2.5-72b": { inputPerMTok: 0.13, outputPerMTok: 0.4 },
  "qwen-2.5-coder-32b": { inputPerMTok: 0.8, outputPerMTok: 0.8 },
  "qwen-2.5-7b-turbo": { inputPerMTok: 0.3, outputPerMTok: 0.3 },
  "qwq-32b": { inputPerMTok: 0.5, outputPerMTok: 1.5 },

  // ===================
  // Cohere Models
  // ===================
  "command-r-plus": { inputPerMTok: 2.5, outputPerMTok: 10.0 },
  "command-r": { inputPerMTok: 0.15, outputPerMTok: 0.6 },

  // ===================
  // Cursor-specific model names (aliases for common models)
  // ===================
  auto: { inputPerMTok: 2.5, outputPerMTok: 10.0 }, // Default/auto typically uses GPT-4o level
  "composer-1": { inputPerMTok: 2.5, outputPerMTok: 10.0 },
  agent_review: { inputPerMTok: 0.5, outputPerMTok: 3.0 }, // Likely uses cheaper model
};

const MODEL_ALIASES: Array<{ pattern: RegExp; key: string }> = [
  // ===================
  // OpenAI GPT Models
  // ===================
  { pattern: /^gpt-5\.2-pro/i, key: "gpt-5.2-pro" },
  { pattern: /^gpt-5\.2/i, key: "gpt-5.2" },
  { pattern: /^gpt-5\.1/i, key: "gpt-5.1" },
  { pattern: /^gpt-5-pro/i, key: "gpt-5-pro" },
  { pattern: /^gpt-5-mini/i, key: "gpt-5-mini" },
  { pattern: /^gpt-5-nano/i, key: "gpt-5-nano" },
  { pattern: /^gpt-5$/i, key: "gpt-5" },
  { pattern: /^gpt-4\.1-mini/i, key: "gpt-4.1-mini" },
  { pattern: /^gpt-4\.1-nano/i, key: "gpt-4.1-nano" },
  { pattern: /^gpt-4\.1/i, key: "gpt-4.1" },
  { pattern: /^gpt-4o-mini/i, key: "gpt-4o-mini" },
  { pattern: /^gpt-4o-2024-05-13/i, key: "gpt-4o-2024-05-13" },
  { pattern: /^gpt-4o/i, key: "gpt-4o" },
  { pattern: /^chatgpt-4o/i, key: "chatgpt-4o-latest" },
  { pattern: /^gpt-4-0125/i, key: "gpt-4-turbo" },
  { pattern: /^gpt-4-1106/i, key: "gpt-4-turbo" },
  { pattern: /^gpt-4-vision-preview/i, key: "gpt-4-turbo" },
  { pattern: /^gpt-4-turbo/i, key: "gpt-4-turbo" },
  { pattern: /^gpt-4-32k/i, key: "gpt-4-32k" },
  { pattern: /^gpt-4/i, key: "gpt-4" },
  { pattern: /^gpt-3\.5/i, key: "gpt-3.5-turbo" },

  // ===================
  // OpenAI Reasoning Models (o-series)
  // ===================
  { pattern: /^o1-pro/i, key: "o1-pro" },
  { pattern: /^o1-mini/i, key: "o1-mini" },
  { pattern: /^o1/i, key: "o1" },
  { pattern: /^o3-deep-research/i, key: "o3-deep-research" },
  { pattern: /^o3-pro/i, key: "o3-pro" },
  { pattern: /^o3-mini/i, key: "o3-mini" },
  { pattern: /^o3/i, key: "o3" },
  { pattern: /^o4-mini-deep-research/i, key: "o4-mini-deep-research" },
  { pattern: /^o4-mini/i, key: "o4-mini" },

  // ===================
  // Anthropic Claude Models
  // ===================
  // Claude 4.5 patterns (various naming formats from different tools)
  { pattern: /^claude-opus-4-5/i, key: "claude-opus-4.5" },
  { pattern: /^claude-opus-4\.5/i, key: "claude-opus-4.5" },
  { pattern: /^claude-4\.5-opus/i, key: "claude-opus-4.5" },
  { pattern: /^claude-4-5-opus/i, key: "claude-opus-4.5" },
  { pattern: /^claude-sonnet-4-5/i, key: "claude-sonnet-4.5" },
  { pattern: /^claude-sonnet-4\.5/i, key: "claude-sonnet-4.5" },
  { pattern: /^claude-4\.5-sonnet/i, key: "claude-sonnet-4.5" },
  { pattern: /^claude-4-5-sonnet/i, key: "claude-sonnet-4.5" },
  { pattern: /^claude-haiku-4-5/i, key: "claude-haiku-4.5" },
  { pattern: /^claude-haiku-4\.5/i, key: "claude-haiku-4.5" },
  { pattern: /^claude-4\.5-haiku/i, key: "claude-haiku-4.5" },
  { pattern: /^claude-4-5-haiku/i, key: "claude-haiku-4.5" },
  // Claude 4 patterns
  { pattern: /^claude-opus-4/i, key: "claude-opus-4" },
  { pattern: /^claude-4-opus/i, key: "claude-opus-4" },
  { pattern: /^claude-sonnet-4/i, key: "claude-sonnet-4" },
  { pattern: /^claude-4-sonnet/i, key: "claude-sonnet-4" },
  // Claude 3.x patterns
  { pattern: /^claude-sonnet-3-7/i, key: "claude-sonnet-3.7" },
  { pattern: /^claude-sonnet-3\.7/i, key: "claude-sonnet-3.7" },
  { pattern: /^claude-3-7-sonnet/i, key: "claude-sonnet-3.7" },
  { pattern: /^claude-3\.7-sonnet/i, key: "claude-sonnet-3.7" },
  { pattern: /^claude-sonnet-3-5/i, key: "claude-sonnet-3.5" },
  { pattern: /^claude-sonnet-3\.5/i, key: "claude-sonnet-3.5" },
  { pattern: /^claude-3-5-sonnet/i, key: "claude-sonnet-3.5" },
  { pattern: /^claude-3\.5-sonnet/i, key: "claude-sonnet-3.5" },
  { pattern: /^claude-opus-3/i, key: "claude-opus-3" },
  { pattern: /^claude-3-opus/i, key: "claude-opus-3" },
  { pattern: /^claude-haiku-3-5/i, key: "claude-haiku-3.5" },
  { pattern: /^claude-haiku-3\.5/i, key: "claude-haiku-3.5" },
  { pattern: /^claude-3-5-haiku/i, key: "claude-haiku-3.5" },
  { pattern: /^claude-3\.5-haiku/i, key: "claude-haiku-3.5" },
  { pattern: /^claude-haiku-3/i, key: "claude-haiku-3" },
  { pattern: /^claude-3-haiku/i, key: "claude-haiku-3" },

  // ===================
  // Google Gemini Models
  // ===================
  { pattern: /^gemini-3-pro/i, key: "gemini-3-pro" },
  { pattern: /^gemini-3-flash/i, key: "gemini-3-flash" },
  { pattern: /^gemini-2\.5-pro/i, key: "gemini-2.5-pro" },
  { pattern: /^gemini-2\.5-flash-lite/i, key: "gemini-2.5-flash-lite" },
  { pattern: /^gemini-2\.5-flash/i, key: "gemini-2.5-flash" },
  { pattern: /^gemini-2\.0-pro/i, key: "gemini-2.0-pro" },
  { pattern: /^gemini-2\.0-flash-lite/i, key: "gemini-2.0-flash-lite" },
  { pattern: /^gemini-2\.0-flash/i, key: "gemini-2.0-flash" },
  { pattern: /^gemini-1\.5-pro/i, key: "gemini-1.5-pro" },
  { pattern: /^gemini-1\.5-flash/i, key: "gemini-1.5-flash" },
  // Generic gemini patterns (fallback to flash as most common)
  { pattern: /^gemini-pro/i, key: "gemini-2.5-pro" },
  { pattern: /^gemini-flash/i, key: "gemini-2.5-flash" },

  // ===================
  // xAI Grok Models
  // ===================
  { pattern: /^grok-4\.1-fast/i, key: "grok-4.1-fast" },
  { pattern: /^grok-4/i, key: "grok-4" },
  { pattern: /^grok-3/i, key: "grok-3" },
  { pattern: /^grok-2-vision/i, key: "grok-2-vision" },
  { pattern: /^grok-2/i, key: "grok-2" },
  { pattern: /^grok/i, key: "grok-3" },

  // ===================
  // Mistral AI Models
  // ===================
  { pattern: /^mistral-large-3/i, key: "mistral-large-3" },
  { pattern: /^mistral-large-2/i, key: "mistral-large-2" },
  { pattern: /^mistral-large/i, key: "mistral-large" },
  { pattern: /^mistral-medium-3\.1/i, key: "mistral-medium-3.1" },
  { pattern: /^mistral-medium-3/i, key: "mistral-medium-3" },
  { pattern: /^mistral-medium/i, key: "mistral-medium" },
  { pattern: /^mistral-small/i, key: "mistral-small" },
  { pattern: /^ministral-3b/i, key: "ministral-3b" },
  { pattern: /^ministral-8b/i, key: "ministral-8b" },
  { pattern: /^ministral-14b/i, key: "ministral-14b" },
  { pattern: /^codestral/i, key: "codestral" },
  { pattern: /^mixtral-8x7b/i, key: "mixtral-8x7b" },
  { pattern: /^mixtral/i, key: "mixtral-8x7b" },

  // ===================
  // DeepSeek Models
  // ===================
  { pattern: /^deepseek-v3/i, key: "deepseek-v3" },
  { pattern: /^deepseek-chat/i, key: "deepseek-chat" },
  { pattern: /^deepseek-r1/i, key: "deepseek-r1" },
  { pattern: /^deepseek-reasoner/i, key: "deepseek-reasoner" },
  { pattern: /^deepseek/i, key: "deepseek-v3" },

  // ===================
  // Meta Llama Models
  // ===================
  { pattern: /^llama-4-scout/i, key: "llama-4-scout" },
  { pattern: /^llama-4-maverick/i, key: "llama-4-maverick" },
  { pattern: /^llama-3\.3-70b/i, key: "llama-3.3-70b" },
  { pattern: /^llama-3\.1-405b/i, key: "llama-3.1-405b" },
  { pattern: /^llama-3\.1-70b/i, key: "llama-3.1-70b" },
  { pattern: /^llama-3\.1-8b/i, key: "llama-3.1-8b" },
  { pattern: /^llama-4/i, key: "llama-4-maverick" },
  { pattern: /^llama-3/i, key: "llama-3.3-70b" },
  { pattern: /^llama/i, key: "llama-3.3-70b" },

  // ===================
  // Alibaba Qwen Models
  // ===================
  { pattern: /^qwen-2\.5-max/i, key: "qwen-2.5-max" },
  { pattern: /^qwen2\.5-max/i, key: "qwen-2.5-max" },
  { pattern: /^qwen-2\.5-72b/i, key: "qwen-2.5-72b" },
  { pattern: /^qwen2\.5-72b/i, key: "qwen-2.5-72b" },
  { pattern: /^qwen-2\.5-coder/i, key: "qwen-2.5-coder-32b" },
  { pattern: /^qwen2\.5-coder/i, key: "qwen-2.5-coder-32b" },
  { pattern: /^qwen-2\.5-7b/i, key: "qwen-2.5-7b-turbo" },
  { pattern: /^qwen2\.5-7b/i, key: "qwen-2.5-7b-turbo" },
  { pattern: /^qwq-32b/i, key: "qwq-32b" },
  { pattern: /^qwq/i, key: "qwq-32b" },
  { pattern: /^qwen/i, key: "qwen-2.5-max" },

  // ===================
  // Cohere Models
  // ===================
  { pattern: /^command-r-plus/i, key: "command-r-plus" },
  { pattern: /^command-r\+/i, key: "command-r-plus" },
  { pattern: /^command-r$/i, key: "command-r" },
  { pattern: /^command/i, key: "command-r-plus" },

  // ===================
  // Cursor-specific model names
  // ===================
  { pattern: /^auto$/i, key: "auto" },
  { pattern: /^composer/i, key: "composer-1" },
  { pattern: /^agent_review/i, key: "agent_review" },
];

const DEFAULT_OPENAI_PRICING: ModelPricing = {
  inputPerMTok: 2.5,
  outputPerMTok: 10.0,
};

const DEFAULT_ANTHROPIC_PRICING: ModelPricing = {
  inputPerMTok: 3.0,
  outputPerMTok: 15.0,
};

const DEFAULT_GEMINI_PRICING: ModelPricing = {
  inputPerMTok: 0.5,
  outputPerMTok: 3.0,
};

const DEFAULT_MISTRAL_PRICING: ModelPricing = {
  inputPerMTok: 0.5,
  outputPerMTok: 1.5,
};

const DEFAULT_DEEPSEEK_PRICING: ModelPricing = {
  inputPerMTok: 0.27,
  outputPerMTok: 1.1,
};

const DEFAULT_LLAMA_PRICING: ModelPricing = {
  inputPerMTok: 0.5,
  outputPerMTok: 0.75,
};

function resolvePricing(model: string | null | undefined): ModelPricing {
  if (!model) {
    return DEFAULT_OPENAI_PRICING;
  }

  const normalized = model.toLowerCase();

  // First try exact match in PRICING_BY_MODEL
  if (PRICING_BY_MODEL[normalized]) {
    return PRICING_BY_MODEL[normalized];
  }

  // Then try aliases
  for (const alias of MODEL_ALIASES) {
    if (alias.pattern.test(normalized)) {
      return PRICING_BY_MODEL[alias.key] || DEFAULT_OPENAI_PRICING;
    }
  }

  // Provider-specific defaults
  if (normalized.startsWith("claude")) {
    return DEFAULT_ANTHROPIC_PRICING;
  }

  if (normalized.startsWith("gemini")) {
    return DEFAULT_GEMINI_PRICING;
  }

  if (normalized.startsWith("mistral") || normalized.startsWith("ministral") || normalized.startsWith("mixtral") || normalized.startsWith("codestral")) {
    return DEFAULT_MISTRAL_PRICING;
  }

  if (normalized.startsWith("deepseek")) {
    return DEFAULT_DEEPSEEK_PRICING;
  }

  if (normalized.startsWith("llama") || normalized.startsWith("meta-llama")) {
    return DEFAULT_LLAMA_PRICING;
  }

  if (normalized.startsWith("grok")) {
    return { inputPerMTok: 3.0, outputPerMTok: 15.0 };
  }

  if (normalized.startsWith("qwen") || normalized.startsWith("qwq")) {
    return { inputPerMTok: 1.0, outputPerMTok: 4.0 };
  }

  if (normalized.startsWith("command")) {
    return { inputPerMTok: 2.5, outputPerMTok: 10.0 };
  }

  if (normalized.startsWith("gpt") || normalized.startsWith("o1") || normalized.startsWith("o3") || normalized.startsWith("o4")) {
    return DEFAULT_OPENAI_PRICING;
  }

  return DEFAULT_OPENAI_PRICING;
}

export function estimateApiSpendUsd({
  model,
  totalTokens,
  inputFraction = DEFAULT_INPUT_FRACTION,
}: {
  model?: string | null;
  totalTokens: number;
  inputFraction?: number;
}): number {
  if (!totalTokens || totalTokens <= 0) {
    return 0;
  }

  const pricing = resolvePricing(model);
  const clampedInput = Math.min(Math.max(inputFraction, 0), 1);
  const inputTokens = totalTokens * clampedInput;
  const outputTokens = totalTokens - inputTokens;

  return (
    (inputTokens / 1_000_000) * pricing.inputPerMTok +
    (outputTokens / 1_000_000) * pricing.outputPerMTok
  );
}
