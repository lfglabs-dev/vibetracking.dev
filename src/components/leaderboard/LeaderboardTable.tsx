"use client";

import { formatCurrency } from "@/lib/utils";
import Link from "next/link";
import { ChallengeUserButton } from "@/components/challenge/ChallengeUserButton";

interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  company: string | null;
  estimatedSpend: number;
  totalSessions: number;
  currentStreak: number;
  profileUrl: string;
}

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
  currentUserId?: string;
  currentUsername?: string;
}

export function LeaderboardTable({
  entries,
  currentUserId,
  currentUsername,
}: LeaderboardTableProps) {
  if (entries.length === 0) {
    return (
      <div className="card text-center py-12">
        <div className="text-4xl mb-4">🏆</div>
        <h3 className="text-lg font-bold mb-2">No vibers yet!</h3>
        <p className="text-[#232323]/70">Be the first to track your vibes</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="text-left text-sm uppercase text-[#232323]/60">
            <th className="py-3 px-4 font-medium">Rank</th>
            <th className="py-3 px-4 font-medium">Vibe Coder</th>
            <th className="py-3 px-4 font-medium">Company</th>
            <th className="py-3 px-4 font-medium text-right">Est. API Spend</th>
            <th className="py-3 px-4 font-medium text-right">Streak</th>
            {currentUsername && <th className="py-3 px-4 font-medium"></th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#232323]/10">
          {entries.map((entry) => {
            const isCurrentUser = currentUserId === entry.userId;
            const rankBadge =
              entry.rank === 1
                ? "🥇"
                : entry.rank === 2
                ? "🥈"
                : entry.rank === 3
                ? "🥉"
                : `#${entry.rank}`;

            return (
              <tr
                key={entry.userId}
                className={`${
                  isCurrentUser ? "bg-[#AAE7C0]/20" : "hover:bg-white/50"
                } transition-colors`}
              >
                <td className="py-4 px-4">
                  <span
                    className={`font-bold ${
                      entry.rank <= 3 ? "text-2xl" : "text-[#232323]/70"
                    }`}
                  >
                    {rankBadge}
                  </span>
                </td>
                <td className="py-4 px-4">
                  <Link
                    href={entry.profileUrl}
                    className="flex items-center gap-3 hover:opacity-80"
                  >
                    {entry.avatarUrl ? (
                      <img
                        src={entry.avatarUrl}
                        alt={entry.displayName || entry.username}
                        className="w-10 h-10 rounded-full border border-[#232323]"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-[#FEA6CC] border border-[#232323] flex items-center justify-center font-bold">
                        {(entry.displayName || entry.username)
                          .charAt(0)
                          .toUpperCase()}
                      </div>
                    )}
                    <div>
                      <div className="font-semibold">
                        {entry.displayName || entry.username}
                      </div>
                      <div className="text-sm text-[#232323]/60">
                        @{entry.username}
                      </div>
                    </div>
                  </Link>
                </td>
                <td className="py-4 px-4">
                  {entry.company ? (
                    <span className="tag tag-blue text-xs">
                      {entry.company}
                    </span>
                  ) : (
                    <span className="text-[#232323]/40">—</span>
                  )}
                </td>
                <td className="py-4 px-4 text-right font-mono font-bold">
                  {formatCurrency(entry.estimatedSpend)}
                </td>
                <td className="py-4 px-4 text-right">
                  {entry.currentStreak > 0 ? (
                    <span className="inline-flex items-center gap-1">
                      🔥 {entry.currentStreak}d
                    </span>
                  ) : (
                    <span className="text-[#232323]/40">—</span>
                  )}
                </td>
                {currentUsername && (
                  <td className="py-4 px-4">
                    {!isCurrentUser && (
                      <ChallengeUserButton
                        myUsername={currentUsername}
                        opponentUsername={entry.username}
                        opponentDisplayName={entry.displayName || undefined}
                        variant="small"
                      />
                    )}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
