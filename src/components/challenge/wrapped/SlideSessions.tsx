"use client";

import { BattleSlide } from "./BattleSlide";
import { BattleSticker } from "./BattleSticker";
import { useCountUp } from "@/hooks/useCountUp";
import type { BattleStats } from "@/lib/challenges";

interface SlideSessionsProps {
  user: BattleStats;
  rival: BattleStats;
  animationKey: number;
}

export function SlideSessions({
  user,
  rival,
  animationKey,
}: SlideSessionsProps) {
  const userSessions = useCountUp({
    end: user.totalSessions,
    delay: 400,
    enabled: true,
    formatter: (val) => Math.round(val).toLocaleString(),
  });

  const rivalSessions = useCountUp({
    end: rival.totalSessions,
    delay: 400,
    enabled: true,
    formatter: (val) => Math.round(val).toLocaleString(),
  });

  const winner =
    user.totalSessions > rival.totalSessions
      ? "user"
      : rival.totalSessions > user.totalSessions
        ? "rival"
        : "tie";

  const userName = user.displayName || user.username;
  const rivalName = rival.displayName || rival.username;

  return (
    <BattleSlide
      user={user}
      rival={rival}
      slideIndex={1}
      totalSlides={6}
      title="Round 2: Sessions"
      animationKey={animationKey}
      sticker={
        <BattleSticker
          imageSrc="/stickers/no_em_dashes.webp"
          quote="You've probably said that a few times too"
          position="inline"
          stickerDelay={0}
          bubbleDelay={100}
          stickerSize={160}
          bubbleSize="large"
        />
      }
    >
      <div className="space-y-6">
        {/* Total comparison */}
        <div className="flex items-center justify-center gap-6">
          <div
            className={`text-center p-4 rounded-xl border-2 min-w-[140px] ${
              winner === "user"
                ? "border-[#198754] bg-[#198754]/5"
                : "border-[#232323]/10 bg-[#FEA6CC]/10"
            }`}
          >
            <p className="text-xs text-[#232323]/60 mb-1">{userName}</p>
            <p
              className={`text-3xl font-black ${winner === "user" ? "text-[#198754]" : "text-[#232323]"}`}
            >
              {userSessions}
            </p>
          </div>

          <span className="text-xl font-black text-[#232323]/30">vs</span>

          <div
            className={`text-center p-4 rounded-xl border-2 min-w-[140px] ${
              winner === "rival"
                ? "border-[#198754] bg-[#198754]/5"
                : "border-[#232323]/10 bg-[#B3D8F5]/10"
            }`}
          >
            <p className="text-xs text-[#232323]/60 mb-1">{rivalName}</p>
            <p
              className={`text-3xl font-black ${winner === "rival" ? "text-[#198754]" : "text-[#232323]"}`}
            >
              {rivalSessions}
            </p>
          </div>
        </div>
      </div>
    </BattleSlide>
  );
}
