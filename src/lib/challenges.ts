// ============================================
// Types
// ============================================

export interface BattleStats {
  userId: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  totalTokens: number;
  totalSessions: number;
  currentStreak: number;
  longestStreak: number;
  favoriteModel: string | null;
  favoriteTool: string | null;
  estimatedSpend: number;
  activeDays: number;
}

export interface StatComparison {
  label: string;
  challengerValue: string;
  challengedValue: string;
  winner: "challenger" | "challenged" | "tie";
  rawChallengerValue: number;
  rawChallengedValue: number;
}

export interface BattleResult {
  winner: "challenger" | "challenged" | "tie";
  challengerScore: number;
  challengedScore: number;
  statComparisons: StatComparison[];
}

// ============================================
// Constants - Trash Talk Messages
// ============================================

export interface TrashTalkMessage {
  id: number;
  text: string;
  shareText: string; // Shorter version for social sharing
}

export const TRASH_TALK_MESSAGES: TrashTalkMessage[] = [
  {
    id: 0,
    text: "I'm the ultimate vibe coder. Think you can compete?",
    shareText: "I'm the ultimate vibe coder. Think you can compete?",
  },
  {
    id: 1,
    text: "My AI writes better code than you ever will.",
    shareText: "My AI writes better code than yours ever will.",
  },
  {
    id: 2,
    text: "Step up or step aside. I own the leaderboard.",
    shareText: "Step up or step aside. I own the leaderboard.",
  },
  {
    id: 3,
    text: "I've got more tokens than you've got commits.",
    shareText: "I've got more tokens than you've got commits.",
  },
  {
    id: 4,
    text: "Think you can out-vibe me? Prove it.",
    shareText: "Think you can out-vibe me? Prove it.",
  },
  {
    id: 5,
    text: "Ready to get humbled? Bring your stats.",
    shareText: "Ready to get humbled? Bring your stats.",
  },
  {
    id: 6,
    text: "Let's settle this. My vibes vs yours.",
    shareText: "Let's settle this. My vibes vs yours.",
  },
  {
    id: 7,
    text: "I didn't choose the vibe life. The vibe life chose me.",
    shareText: "I didn't choose the vibe life. It chose me.",
  },
];

// ============================================
// Constants - Victory Messages
// ============================================

export const VICTORY_MESSAGES = [
  "Absolute domination! {winner} is the true vibe coder!",
  "{winner} sent {loser} back to VS Code.",
  "Not even close. {winner} wins by a landslide!",
  "{winner} proved who the real AI whisperer is.",
  "GG! {winner} takes the crown!",
];

export const TIE_MESSAGES = [
  "It's a draw! Both are elite vibe coders.",
  "Too close to call. Respect all around.",
  "A perfect tie! Two legends facing off.",
];

// ============================================
// Constants - Scoring Weights
// ============================================

export const STAT_WEIGHTS: Record<string, number> = {
  estimatedSpend: 3, // Primary metric - 3 points
  totalTokens: 2, // 2 points
  currentStreak: 2, // 2 points (engagement)
  totalSessions: 1, // 1 point
  activeDays: 1, // 1 point
  longestStreak: 1, // 1 point
};

// ============================================
// Helper Functions
// ============================================

export function isValidTrashTalkId(id: number): boolean {
  return id >= 0 && id < TRASH_TALK_MESSAGES.length;
}

export function getTrashTalkMessage(id: number): TrashTalkMessage {
  return TRASH_TALK_MESSAGES[id] || TRASH_TALK_MESSAGES[0];
}

export function getRandomTrashTalkMessage(): TrashTalkMessage {
  const randomIndex = Math.floor(Math.random() * TRASH_TALK_MESSAGES.length);
  return TRASH_TALK_MESSAGES[randomIndex];
}

export function getVictoryMessage(
  winnerName: string,
  loserName: string
): string {
  const randomIndex = Math.floor(Math.random() * VICTORY_MESSAGES.length);
  return VICTORY_MESSAGES[randomIndex]
    .replace("{winner}", winnerName)
    .replace("{loser}", loserName);
}

export function getTieMessage(): string {
  const randomIndex = Math.floor(Math.random() * TIE_MESSAGES.length);
  return TIE_MESSAGES[randomIndex];
}

// ============================================
// Winner Determination
// ============================================

export function determineWinner(
  challengerStats: BattleStats,
  challengedStats: BattleStats
): BattleResult {
  let challengerScore = 0;
  let challengedScore = 0;
  const statComparisons: StatComparison[] = [];

  // Define the stats to compare with their labels and formatters
  const statsToCompare: Array<{
    key: keyof BattleStats;
    label: string;
    format: (val: number) => string;
  }> = [
    {
      key: "estimatedSpend",
      label: "API Spend",
      format: (v) =>
        `$${v.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
    },
    {
      key: "totalTokens",
      label: "Total Tokens",
      format: (v) => formatCompactNumber(v),
    },
    {
      key: "totalSessions",
      label: "Sessions",
      format: (v) => v.toLocaleString(),
    },
    {
      key: "currentStreak",
      label: "Current Streak",
      format: (v) => `${v} days`,
    },
    {
      key: "longestStreak",
      label: "Longest Streak",
      format: (v) => `${v} days`,
    },
    {
      key: "activeDays",
      label: "Active Days",
      format: (v) => `${v} days`,
    },
  ];

  for (const stat of statsToCompare) {
    const cValue = (challengerStats[stat.key] as number) || 0;
    const dValue = (challengedStats[stat.key] as number) || 0;
    const weight = STAT_WEIGHTS[stat.key] || 1;

    let winner: "challenger" | "challenged" | "tie" = "tie";
    if (cValue > dValue) {
      challengerScore += weight;
      winner = "challenger";
    } else if (dValue > cValue) {
      challengedScore += weight;
      winner = "challenged";
    }

    statComparisons.push({
      label: stat.label,
      challengerValue: stat.format(cValue),
      challengedValue: stat.format(dValue),
      winner,
      rawChallengerValue: cValue,
      rawChallengedValue: dValue,
    });
  }

  // Determine overall winner
  let winner: "challenger" | "challenged" | "tie";
  if (challengerScore > challengedScore) {
    winner = "challenger";
  } else if (challengedScore > challengerScore) {
    winner = "challenged";
  } else {
    // Tie-breaker: compare estimatedSpend directly
    if (challengerStats.estimatedSpend > challengedStats.estimatedSpend) {
      winner = "challenger";
    } else if (challengedStats.estimatedSpend > challengerStats.estimatedSpend) {
      winner = "challenged";
    } else {
      // Still tied: compare totalTokens
      if (challengerStats.totalTokens > challengedStats.totalTokens) {
        winner = "challenger";
      } else if (challengedStats.totalTokens > challengerStats.totalTokens) {
        winner = "challenged";
      } else {
        winner = "tie";
      }
    }
  }

  return {
    winner,
    challengerScore,
    challengedScore,
    statComparisons,
  };
}

/**
 * Calculate estimated spend from token usage data
 */
export function calculateEstimatedSpend(
  tokenUsage: Array<{ model: string; input_tokens: number | null; output_tokens: number | null }>,
  estimateApiSpendUsd: (params: { model: string; totalTokens: number; inputFraction: number }) => number
): number {
  let estimatedSpend = 0;
  for (const usage of tokenUsage) {
    const totalTokens = (usage.input_tokens || 0) + (usage.output_tokens || 0);
    const inputFraction = totalTokens > 0 ? (usage.input_tokens || 0) / totalTokens : 0.7;
    estimatedSpend += estimateApiSpendUsd({
      model: usage.model,
      totalTokens,
      inputFraction,
    });
  }
  return estimatedSpend;
}

export function formatCompactNumber(num: number): string {
  if (num >= 1_000_000_000) {
    return (num / 1_000_000_000).toFixed(1) + "B";
  }
  if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(1) + "M";
  }
  if (num >= 1_000) {
    return (num / 1_000).toFixed(1) + "K";
  }
  return num.toString();
}
