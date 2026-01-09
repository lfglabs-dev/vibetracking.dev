"use client";

import { BattleWrapped } from "@/components/challenge/wrapped/BattleWrapped";
import { determineWinner, type BattleStats } from "@/lib/challenges";

// Mock data for testing the battle wrapped component
const mockChallenger: BattleStats = {
  userId: "user-1",
  username: "fricoben",
  displayName: "Frico Ben",
  avatarUrl: "https://avatars.githubusercontent.com/u/123456?v=4",
  totalTokens: 15_234_567,
  totalSessions: 342,
  currentStreak: 12,
  longestStreak: 45,
  favoriteModel: "claude-opus-4-20250514",
  favoriteTool: "claude",
  estimatedSpend: 2450,
  activeDays: 89,
  toolStats: {
    claude: { tokens: 12_000_000, sessions: 250 },
    cursor: { tokens: 2_500_000, sessions: 70 },
    codex: { tokens: 734_567, sessions: 22 },
  },
};

const mockChallenged: BattleStats = {
  userId: "user-2",
  username: "codewizard",
  displayName: "Code Wizard",
  avatarUrl: "https://avatars.githubusercontent.com/u/654321?v=4",
  totalTokens: 12_876_543,
  totalSessions: 287,
  currentStreak: 8,
  longestStreak: 38,
  favoriteModel: "gpt-4o",
  favoriteTool: "cursor",
  estimatedSpend: 1890,
  activeDays: 72,
  toolStats: {
    claude: { tokens: 1_500_000, sessions: 40 },
    cursor: { tokens: 10_000_000, sessions: 220 },
    codex: { tokens: 1_376_543, sessions: 27 },
  },
};

export default function MockBattlePage() {
  const result = determineWinner(mockChallenger, mockChallenged);

  return (
    <BattleWrapped
      challenger={mockChallenger}
      challenged={mockChallenged}
      result={result}
      battleSlug="mock-battle-test"
    />
  );
}
