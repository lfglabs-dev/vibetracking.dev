"use client";

import { BattleSlide } from "./BattleSlide";
import { BattleSticker } from "./BattleSticker";
import { useCountUp } from "@/hooks/useCountUp";
import type { BattleStats } from "@/lib/challenges";

interface SlideStreakProps {
  user: BattleStats;
  rival: BattleStats;
  animationKey: number;
}

export function SlideStreak({ user, rival, animationKey }: SlideStreakProps) {
  const userCurrentStreak = useCountUp({
    end: user.currentStreak,
    delay: 400,
    enabled: true,
    formatter: (val) => Math.round(val).toString(),
  });

  const rivalCurrentStreak = useCountUp({
    end: rival.currentStreak,
    delay: 400,
    enabled: true,
    formatter: (val) => Math.round(val).toString(),
  });

  // Winner based on current streak
  const currentWinner =
    user.currentStreak > rival.currentStreak
      ? "user"
      : rival.currentStreak > user.currentStreak
        ? "rival"
        : "tie";

  const userName = user.displayName || user.username;
  const rivalName = rival.displayName || rival.username;

  return (
    <BattleSlide
      user={user}
      rival={rival}
      slideIndex={2}
      totalSlides={6}
      title="Round 3: Streak"
      animationKey={animationKey}
      sticker={
        <BattleSticker
          imageSrc="/stickers/elon.webp"
          quote="It's 9/9/6 or nothing babe"
          position="inline"
          stickerDelay={0}
          bubbleDelay={100}
          stickerSize={160}
          bubbleSize="large"
        />
      }
    >
      <div className="space-y-6">
        {/* Current Streak */}
        <div className="flex items-center justify-center gap-6">
          {/* User Badge */}
          <div
            className={`flex flex-col items-center p-4 rounded-xl border-2 min-w-[140px] ${
              currentWinner === "user"
                ? "border-[#198754] bg-[#198754]/5 animate-winner-pulse"
                : "border-[#232323]/10 bg-[#FEA6CC]/10"
            }`}
          >
            <span className="text-xs text-[#232323]/60 mb-1">{userName}</span>
            <span
              className={`text-4xl font-black ${currentWinner === "user" ? "text-[#198754]" : "text-[#232323]"}`}
            >
              {userCurrentStreak}
            </span>
            <span className="text-sm text-[#232323]/60">days</span>
          </div>

          <span className="text-xl font-black text-[#232323]/30">vs</span>

          {/* Rival Badge */}
          <div
            className={`flex flex-col items-center p-4 rounded-xl border-2 min-w-[140px] ${
              currentWinner === "rival"
                ? "border-[#198754] bg-[#198754]/5 animate-winner-pulse"
                : "border-[#232323]/10 bg-[#B3D8F5]/10"
            }`}
          >
            <span className="text-xs text-[#232323]/60 mb-1">
              {rivalName}
            </span>
            <span
              className={`text-4xl font-black ${currentWinner === "rival" ? "text-[#198754]" : "text-[#232323]"}`}
            >
              {rivalCurrentStreak}
            </span>
            <span className="text-sm text-[#232323]/60">days</span>
          </div>
        </div>
      </div>
    </BattleSlide>
  );
}
