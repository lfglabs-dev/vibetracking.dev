"use client";

import { BattleSlide } from "./BattleSlide";
import { BattleSticker } from "./BattleSticker";
import { useCountUp } from "@/hooks/useCountUp";
import { formatCompactNumber, type BattleStats } from "@/lib/challenges";
import { estimateApiSpendUsd } from "@/lib/pricing";
import { formatCurrency } from "@/lib/utils";
import { UnitToggle, type DisplayUnit } from "@/components/dashboard/UnitToggle";

interface SlideTokensProps {
  user: BattleStats;
  rival: BattleStats;
  animationKey: number;
  displayUnit: DisplayUnit;
  onDisplayUnitChange: (unit: DisplayUnit) => void;
}

export function SlideTokens({ user, rival, animationKey, displayUnit, onDisplayUnitChange }: SlideTokensProps) {
  // Calculate API spend for each user
  const userSpend = estimateApiSpendUsd({
    model: user.favoriteModel,
    totalTokens: user.totalTokens,
  });
  const rivalSpend = estimateApiSpendUsd({
    model: rival.favoriteModel,
    totalTokens: rival.totalTokens,
  });

  // Determine what values to display based on unit
  const userValue = displayUnit === "usd" ? userSpend : user.totalTokens;
  const rivalValue = displayUnit === "usd" ? rivalSpend : rival.totalTokens;

  const userTokens = useCountUp({
    end: userValue,
    delay: 400,
    enabled: true,
    formatter: displayUnit === "usd"
      ? (val) => formatCurrency(val)
      : (val) => formatCompactNumber(val),
  });

  const rivalTokens = useCountUp({
    end: rivalValue,
    delay: 400,
    enabled: true,
    formatter: displayUnit === "usd"
      ? (val) => formatCurrency(val)
      : (val) => formatCompactNumber(val),
  });

  // Winner is always based on the underlying value (higher spend = winner)
  const winner =
    userValue > rivalValue
      ? "user"
      : rivalValue > userValue
        ? "rival"
        : "tie";

  const userName = user.displayName || user.username;
  const rivalName = rival.displayName || rival.username;

  // Title changes based on display unit
  const slideTitle = displayUnit === "usd" ? "Round 1: API Spend" : "Round 1: Tokens";

  return (
    <BattleSlide
      user={user}
      rival={rival}
      slideIndex={0}
      totalSlides={6}
      title={slideTitle}
      animationKey={animationKey}
      sticker={
        <BattleSticker
          imageSrc="/stickers/rainbow.webp"
          quote="In GPU we trust"
          position="inline"
          stickerDelay={0}
          bubbleDelay={100}
          stickerSize={160}
          bubbleSize="large"
        />
      }
    >
      <div className="space-y-6">
        {/* Unit Toggle - only on this slide */}
        <div className="flex justify-center">
          <UnitToggle value={displayUnit} onChange={onDisplayUnitChange} />
        </div>

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
              {userTokens}
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
              {rivalTokens}
            </p>
          </div>
        </div>
      </div>
    </BattleSlide>
  );
}
