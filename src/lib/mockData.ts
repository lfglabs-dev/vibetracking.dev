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
  }[] = [];

  const today = new Date();
  const daysToGenerate = 365;
  const tools = ["claude_code", "cursor", "codex"];

  // Generate activity for random days
  for (let i = 0; i < daysToGenerate; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];

    // Random chance of having activity that day (based on streak/sessions)
    const activityChance = Math.min(stats.total_sessions / 500, 0.8);
    if (Math.random() < activityChance) {
      const tool = tools[Math.floor(Math.random() * tools.length)];
      const tokensForDay = Math.floor(Math.random() * 150000) + 10000;

      activity.push({
        date: dateStr,
        tool,
        message_count: Math.floor(Math.random() * 50) + 10,
        session_count: Math.floor(Math.random() * 5) + 1,
        total_tokens: tokensForDay,
      });
    }
  }

  return activity;
}

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
  }[] = [];

  const today = new Date();
  const daysToGenerate = 90; // Last 90 days for model breakdown
  const tools = ["claude_code", "cursor", "codex"];
  const models = [
    "claude-sonnet-4-20250514",
    "claude-opus-4-20250514",
    "claude-haiku-3-5-20241022",
    "gpt-4o",
    "o3-mini",
  ];

  // Generate token usage for random days
  for (let i = 0; i < daysToGenerate; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];

    // Random chance of having activity that day
    const activityChance = Math.min(stats.total_sessions / 500, 0.8);
    if (Math.random() < activityChance) {
      // Generate 1-3 model entries per day
      const numModels = Math.floor(Math.random() * 3) + 1;
      for (let j = 0; j < numModels; j++) {
        const tool = tools[Math.floor(Math.random() * tools.length)];
        const model = models[Math.floor(Math.random() * models.length)];
        const totalTokens = Math.floor(Math.random() * 50000) + 5000;

        tokenUsage.push({
          date: dateStr,
          tool,
          model,
          input_tokens: Math.floor(totalTokens * 0.7),
          output_tokens: Math.floor(totalTokens * 0.3),
        });
      }
    }
  }

  return tokenUsage;
}
