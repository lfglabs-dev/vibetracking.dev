// Mock user profiles for testing
export const MOCK_USERS: Record<string, {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  company: string | null;
}> = {
  sarah_codes: {
    id: "1",
    username: "sarah_codes",
    display_name: "Sarah Chen",
    avatar_url: "https://i.pravatar.cc/150?u=sarah",
    company: "Anthropic",
  },
  alex_dev: {
    id: "2",
    username: "alex_dev",
    display_name: "Alex Rivera",
    avatar_url: "https://i.pravatar.cc/150?u=alex",
    company: "Vercel",
  },
  maya_builds: {
    id: "3",
    username: "maya_builds",
    display_name: "Maya Johnson",
    avatar_url: "https://i.pravatar.cc/150?u=maya",
    company: "Supabase",
  },
  kevin_hacks: {
    id: "5",
    username: "kevin_hacks",
    display_name: "Kevin Park",
    avatar_url: "https://i.pravatar.cc/150?u=kevin",
    company: "OpenAI",
  },
  emma_codes: {
    id: "6",
    username: "emma_codes",
    display_name: "Emma Wilson",
    avatar_url: "https://i.pravatar.cc/150?u=emma",
    company: "Stripe",
  },
  james_dev: {
    id: "8",
    username: "james_dev",
    display_name: "James Thompson",
    avatar_url: "https://i.pravatar.cc/150?u=james",
    company: "Linear",
  },
  lisa_builds: {
    id: "9",
    username: "lisa_builds",
    display_name: "Lisa Wang",
    avatar_url: "https://i.pravatar.cc/150?u=lisa",
    company: "Figma",
  },
  mike_codes: {
    id: "10",
    username: "mike_codes",
    display_name: "Mike Brown",
    avatar_url: "https://i.pravatar.cc/150?u=mike",
    company: "Notion",
  },
};

// Mock stats for testing
export const MOCK_STATS: Record<string, {
  total_tokens: number;
  total_sessions: number;
  favorite_model: string | null;
  favorite_tool: string | null;
  longest_session_ms: number;
  longest_streak_days: number;
  current_streak_days: number;
  first_activity_date: string | null;
  last_activity_date: string | null;
  user_percentile?: number;
}> = {
  sarah_codes: {
    total_tokens: 45_892_341,
    total_sessions: 1247,
    favorite_model: "claude-sonnet-4-20250514",
    favorite_tool: "claude_code",
    longest_session_ms: 14_400_000, // 4 hours
    longest_streak_days: 67,
    current_streak_days: 42,
    first_activity_date: "2024-03-15",
    last_activity_date: "2026-01-06",
    user_percentile: 1,
  },
  alex_dev: {
    total_tokens: 38_127_892,
    total_sessions: 982,
    favorite_model: "claude-opus-4-20250514",
    favorite_tool: "cursor",
    longest_session_ms: 10_800_000, // 3 hours
    longest_streak_days: 45,
    current_streak_days: 28,
    first_activity_date: "2024-05-22",
    last_activity_date: "2026-01-05",
    user_percentile: 2,
  },
  maya_builds: {
    total_tokens: 29_451_203,
    total_sessions: 756,
    favorite_model: "claude-sonnet-4-20250514",
    favorite_tool: "claude_code",
    longest_session_ms: 7_200_000, // 2 hours
    longest_streak_days: 52,
    current_streak_days: 35,
    first_activity_date: "2024-06-10",
    last_activity_date: "2026-01-06",
    user_percentile: 5,
  },
  kevin_hacks: {
    total_tokens: 21_347_892,
    total_sessions: 543,
    favorite_model: "gpt-4o",
    favorite_tool: "codex",
    longest_session_ms: 5_400_000, // 1.5 hours
    longest_streak_days: 30,
    current_streak_days: 21,
    first_activity_date: "2024-08-01",
    last_activity_date: "2026-01-04",
    user_percentile: 10,
  },
  emma_codes: {
    total_tokens: 18_923_451,
    total_sessions: 489,
    favorite_model: "claude-sonnet-4-20250514",
    favorite_tool: "cursor",
    longest_session_ms: 9_000_000, // 2.5 hours
    longest_streak_days: 28,
    current_streak_days: 19,
    first_activity_date: "2024-07-15",
    last_activity_date: "2026-01-06",
    user_percentile: 15,
  },
  james_dev: {
    total_tokens: 12_451_892,
    total_sessions: 356,
    favorite_model: "claude-haiku-3-5-20241022",
    favorite_tool: "claude_code",
    longest_session_ms: 3_600_000, // 1 hour
    longest_streak_days: 18,
    current_streak_days: 12,
    first_activity_date: "2024-09-20",
    last_activity_date: "2026-01-05",
    user_percentile: 25,
  },
  lisa_builds: {
    total_tokens: 9_823_451,
    total_sessions: 287,
    favorite_model: "claude-sonnet-4-20250514",
    favorite_tool: "cursor",
    longest_session_ms: 4_500_000, // 1.25 hours
    longest_streak_days: 14,
    current_streak_days: 7,
    first_activity_date: "2024-10-05",
    last_activity_date: "2026-01-03",
    user_percentile: 35,
  },
  mike_codes: {
    total_tokens: 7_451_234,
    total_sessions: 198,
    favorite_model: "claude-opus-4-20250514",
    favorite_tool: "claude_code",
    longest_session_ms: 2_700_000, // 45 minutes
    longest_streak_days: 10,
    current_streak_days: 5,
    first_activity_date: "2024-11-01",
    last_activity_date: "2026-01-02",
    user_percentile: 45,
  },
};

// All 7 supported tools
const ALL_TOOLS = ["claude_code", "cursor", "codex", "opencode", "claude", "gemini", "amp", "droid"] as const;

// Tool usage weights (some tools are more common)
const TOOL_WEIGHTS: Record<string, number> = {
  claude_code: 0.35,
  cursor: 0.25,
  codex: 0.15,
  opencode: 0.08,
  claude: 0.07,
  gemini: 0.05,
  amp: 0.03,
  droid: 0.02,
};

// Weighted random tool selection
function pickWeightedTool(): string {
  const rand = Math.random();
  let cumulative = 0;
  for (const [tool, weight] of Object.entries(TOOL_WEIGHTS)) {
    cumulative += weight;
    if (rand < cumulative) return tool;
  }
  return "claude_code";
}

// Generate mock daily activity for the past year
export function generateMockDailyActivity(username: string) {
  const stats = MOCK_STATS[username];
  if (!stats) return [];

  const activity: {
    date: string;
    tool: string;
    message_count: number;
    session_count: number;
    total_tokens: number;
    cost: number;
  }[] = [];

  const today = new Date();
  const daysToGenerate = 365;

  // Generate activity for random days
  for (let i = 0; i < daysToGenerate; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];

    // Random chance of having activity that day (based on streak/sessions)
    const activityChance = Math.min(stats.total_sessions / 500, 0.8);
    if (Math.random() < activityChance) {
      // Generate 1-3 tool entries per day for variety
      const numTools = Math.random() < 0.3 ? 2 : (Math.random() < 0.1 ? 3 : 1);
      const usedTools = new Set<string>();

      for (let j = 0; j < numTools; j++) {
        let tool = pickWeightedTool();
        // Avoid duplicates
        while (usedTools.has(tool) && usedTools.size < ALL_TOOLS.length) {
          tool = pickWeightedTool();
        }
        usedTools.add(tool);

        const tokensForDay = Math.floor(Math.random() * 150000) + 10000;
        // Cost estimate: roughly $3-15 per 1M tokens average
        const costPerMToken = 3 + Math.random() * 12;
        const cost = (tokensForDay / 1_000_000) * costPerMToken;

        activity.push({
          date: dateStr,
          tool,
          message_count: Math.floor(Math.random() * 50) + 10,
          session_count: Math.floor(Math.random() * 5) + 1,
          total_tokens: tokensForDay,
          cost: Math.round(cost * 100) / 100,
        });
      }
    }
  }

  return activity;
}

// All models with reasoning token support
const REASONING_MODELS = ["o1", "o1-mini", "o1-preview", "o3-mini", "o3"];

// Model pricing tiers (per 1M tokens, input rate)
const MODEL_PRICING: Record<string, number> = {
  "claude-sonnet-4-20250514": 3,
  "claude-opus-4-20250514": 15,
  "claude-haiku-3-5-20241022": 0.8,
  "gpt-4o": 5,
  "gpt-4o-mini": 0.15,
  "o1": 15,
  "o1-mini": 3,
  "o3-mini": 1.1,
  "gemini-2.0-flash": 0.1,
  "gemini-1.5-pro": 1.25,
  "deepseek-v3": 0.27,
  "deepseek-r1": 0.55,
};

// Generate mock token usage for model breakdown
export function generateMockTokenUsage(username: string) {
  const stats = MOCK_STATS[username];
  if (!stats) return [];

  const tokenUsage: {
    date: string;
    tool: string;
    model: string;
    input_tokens: number;
    output_tokens: number;
    cache_read_tokens: number;
    cache_creation_tokens: number;
    reasoning_tokens: number;
    cost: number;
  }[] = [];

  const today = new Date();
  const daysToGenerate = 180; // Last 180 days for model breakdown (for timeline)
  const models = [
    "claude-sonnet-4-20250514",
    "claude-opus-4-20250514",
    "claude-haiku-3-5-20241022",
    "gpt-4o",
    "gpt-4o-mini",
    "o1-mini",
    "o3-mini",
    "gemini-2.0-flash",
    "deepseek-v3",
  ];

  // Track model adoption over time (newer models appear later)
  const modelIntroDate: Record<string, number> = {
    "claude-haiku-3-5-20241022": 180,
    "gpt-4o": 180,
    "claude-sonnet-4-20250514": 120,
    "gpt-4o-mini": 150,
    "claude-opus-4-20250514": 90,
    "o1-mini": 60,
    "gemini-2.0-flash": 45,
    "o3-mini": 30,
    "deepseek-v3": 20,
  };

  // Generate token usage for random days
  for (let i = 0; i < daysToGenerate; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];

    // Random chance of having activity that day
    const activityChance = Math.min(stats.total_sessions / 500, 0.8);
    if (Math.random() < activityChance) {
      // Generate 1-4 model entries per day
      const numModels = Math.floor(Math.random() * 4) + 1;
      for (let j = 0; j < numModels; j++) {
        const tool = pickWeightedTool();

        // Filter models to those available at this time
        const availableModels = models.filter(m => (modelIntroDate[m] || 180) >= i);
        const model = availableModels[Math.floor(Math.random() * availableModels.length)] || "claude-sonnet-4-20250514";

        const totalTokens = Math.floor(Math.random() * 50000) + 5000;
        const inputTokens = Math.floor(totalTokens * 0.7);
        const outputTokens = Math.floor(totalTokens * 0.3);

        // Cache tokens: 20-40% of input tokens are cache reads
        const hasCaching = Math.random() > 0.3;
        const cacheReadTokens = hasCaching ? Math.floor(inputTokens * (0.2 + Math.random() * 0.2)) : 0;
        const cacheCreationTokens = hasCaching ? Math.floor(inputTokens * 0.05) : 0;

        // Reasoning tokens: only for o1/o3 models
        const isReasoningModel = REASONING_MODELS.some(rm => model.includes(rm));
        const reasoningTokens = isReasoningModel ? Math.floor(outputTokens * (0.5 + Math.random() * 1.5)) : 0;

        // Cost calculation
        const pricePerMTok = MODEL_PRICING[model] || 3;
        const effectiveInput = inputTokens - cacheReadTokens; // Cache reads are cheaper
        const cost = (effectiveInput * pricePerMTok + outputTokens * pricePerMTok * 3 + reasoningTokens * pricePerMTok) / 1_000_000;

        tokenUsage.push({
          date: dateStr,
          tool,
          model,
          input_tokens: inputTokens,
          output_tokens: outputTokens,
          cache_read_tokens: cacheReadTokens,
          cache_creation_tokens: cacheCreationTokens,
          reasoning_tokens: reasoningTokens,
          cost: Math.round(cost * 1000) / 1000,
        });
      }
    }
  }

  return tokenUsage;
}
