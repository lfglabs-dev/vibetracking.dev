export type ModelPricing = {
  inputPerMTok: number;
  outputPerMTok: number;
};

export const DEFAULT_INPUT_FRACTION = 0.7;

const PRICING_BY_MODEL: Record<string, ModelPricing> = {
  "gpt-5.2": { inputPerMTok: 1.75, outputPerMTok: 14.0 },
  "gpt-5.2-pro": { inputPerMTok: 21.0, outputPerMTok: 168.0 },
  "gpt-5.1": { inputPerMTok: 1.25, outputPerMTok: 10.0 },
  "gpt-5": { inputPerMTok: 1.25, outputPerMTok: 10.0 },
  "gpt-5-pro": { inputPerMTok: 15.0, outputPerMTok: 120.0 },
  "gpt-5-mini": { inputPerMTok: 0.25, outputPerMTok: 2.0 },
  "gpt-5-nano": { inputPerMTok: 0.05, outputPerMTok: 0.4 },
  "gpt-4.1": { inputPerMTok: 2.0, outputPerMTok: 8.0 },
  "gpt-4.1-mini": { inputPerMTok: 0.4, outputPerMTok: 1.6 },
  "gpt-4.1-nano": { inputPerMTok: 0.1, outputPerMTok: 0.4 },
  "gpt-4o": { inputPerMTok: 2.5, outputPerMTok: 10.0 },
  "gpt-4o-2024-05-13": { inputPerMTok: 5.0, outputPerMTok: 15.0 },
  "gpt-4o-mini": { inputPerMTok: 0.15, outputPerMTok: 0.6 },
  "chatgpt-4o-latest": { inputPerMTok: 5.0, outputPerMTok: 15.0 },
  "gpt-4-turbo": { inputPerMTok: 10.0, outputPerMTok: 30.0 },
  "gpt-4": { inputPerMTok: 30.0, outputPerMTok: 60.0 },
  "gpt-4-32k": { inputPerMTok: 60.0, outputPerMTok: 120.0 },
  "gpt-3.5-turbo": { inputPerMTok: 0.5, outputPerMTok: 1.5 },
  o1: { inputPerMTok: 15.0, outputPerMTok: 60.0 },
  "o1-mini": { inputPerMTok: 1.1, outputPerMTok: 4.4 },
  "o1-pro": { inputPerMTok: 150.0, outputPerMTok: 600.0 },
  o3: { inputPerMTok: 2.0, outputPerMTok: 8.0 },
  "o3-mini": { inputPerMTok: 1.1, outputPerMTok: 4.4 },
  "o3-pro": { inputPerMTok: 20.0, outputPerMTok: 80.0 },
  "o4-mini": { inputPerMTok: 1.1, outputPerMTok: 4.4 },
  "claude-opus-4": { inputPerMTok: 15.0, outputPerMTok: 75.0 },
  "claude-sonnet-4": { inputPerMTok: 3.0, outputPerMTok: 15.0 },
  "claude-sonnet-3.7": { inputPerMTok: 3.0, outputPerMTok: 15.0 },
  "claude-sonnet-3.5": { inputPerMTok: 3.0, outputPerMTok: 15.0 },
  "claude-opus-3": { inputPerMTok: 15.0, outputPerMTok: 75.0 },
  "claude-haiku-3.5": { inputPerMTok: 0.8, outputPerMTok: 4.0 },
  "claude-haiku-3": { inputPerMTok: 0.25, outputPerMTok: 1.25 },
};

const MODEL_ALIASES: Array<{ pattern: RegExp; key: string }> = [
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
  { pattern: /^o1-pro/i, key: "o1-pro" },
  { pattern: /^o1-mini/i, key: "o1-mini" },
  { pattern: /^o1/i, key: "o1" },
  { pattern: /^o3-pro/i, key: "o3-pro" },
  { pattern: /^o3-mini/i, key: "o3-mini" },
  { pattern: /^o3/i, key: "o3" },
  { pattern: /^o4-mini/i, key: "o4-mini" },
  { pattern: /^claude-opus-4/i, key: "claude-opus-4" },
  { pattern: /^claude-sonnet-4/i, key: "claude-sonnet-4" },
  { pattern: /^claude-sonnet-3-7/i, key: "claude-sonnet-3.7" },
  { pattern: /^claude-sonnet-3-5/i, key: "claude-sonnet-3.5" },
  { pattern: /^claude-opus-3/i, key: "claude-opus-3" },
  { pattern: /^claude-haiku-3-5/i, key: "claude-haiku-3.5" },
  { pattern: /^claude-haiku-3/i, key: "claude-haiku-3" },
  { pattern: /^claude-4-opus/i, key: "claude-opus-4" },
  { pattern: /^claude-4-sonnet/i, key: "claude-sonnet-4" },
  { pattern: /^claude-3-7-sonnet/i, key: "claude-sonnet-3.7" },
  { pattern: /^claude-3-5-sonnet/i, key: "claude-sonnet-3.5" },
  { pattern: /^claude-3-opus/i, key: "claude-opus-3" },
  { pattern: /^claude-3-5-haiku/i, key: "claude-haiku-3.5" },
  { pattern: /^claude-3-haiku/i, key: "claude-haiku-3" },
];

const DEFAULT_OPENAI_PRICING: ModelPricing = {
  inputPerMTok: 2.5,
  outputPerMTok: 10.0,
};

const DEFAULT_ANTHROPIC_PRICING: ModelPricing = {
  inputPerMTok: 3.0,
  outputPerMTok: 15.0,
};

function resolvePricing(model: string | null | undefined): ModelPricing {
  if (!model) {
    return DEFAULT_OPENAI_PRICING;
  }

  const normalized = model.toLowerCase();

  for (const alias of MODEL_ALIASES) {
    if (alias.pattern.test(normalized)) {
      return PRICING_BY_MODEL[alias.key] || DEFAULT_OPENAI_PRICING;
    }
  }

  if (normalized.startsWith("claude")) {
    return DEFAULT_ANTHROPIC_PRICING;
  }

  if (normalized.startsWith("gpt") || normalized.startsWith("o")) {
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
