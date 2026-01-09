"use client";

import { type ReactNode } from "react";
import type { BattleStats } from "@/lib/challenges";

interface BattleSlideProps {
  user: BattleStats;
  rival: BattleStats;
  slideIndex: number;
  totalSlides: number;
  title: string;
  children: ReactNode;
  animationKey: number;
  sticker?: ReactNode;
}

export function BattleSlide({
  user,
  rival,
  slideIndex,
  totalSlides,
  title,
  children,
  animationKey,
  sticker,
}: BattleSlideProps) {
  return (
    <div
      key={animationKey}
      className="battle-slide card relative animate-slide-fade-in"
    >
      {/* Main Content Area */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 py-6">
        {/* Title */}
        <h1 className="text-4xl font-black mb-6 animate-initial animate-slide-up animate-delay-100">
          {title}
        </h1>

        {/* Sticker Area - Above Stats */}
        {sticker && (
          <div className="mb-6 animate-initial animate-fade-in animate-delay-200">
            {sticker}
          </div>
        )}

        {/* Slot for stat content */}
        <div className="w-full animate-initial animate-scale-pop animate-delay-300">
          {children}
        </div>
      </main>
    </div>
  );
}

// Reusable VS comparison layout for stats
interface StatComparisonProps {
  userValue: string | ReactNode;
  rivalValue: string | ReactNode;
  userLabel?: string;
  rivalLabel?: string;
  winner?: "user" | "rival" | "tie";
  large?: boolean;
}

export function StatComparison({
  userValue,
  rivalValue,
  userLabel,
  rivalLabel,
  winner,
  large = true,
}: StatComparisonProps) {
  const userWins = winner === "user";
  const rivalWins = winner === "rival";

  return (
    <div className="flex items-center justify-center gap-8">
      {/* User Side */}
      <div
        className={`flex-1 text-center p-6 rounded-xl border-2 transition-all ${
          userWins
            ? "border-[#198754] bg-[#198754]/5 animate-winner-pulse"
            : "border-[#232323]/10 bg-[#FEA6CC]/10"
        }`}
      >
        {userLabel && (
          <p className="text-sm text-[#232323]/60 mb-2">{userLabel}</p>
        )}
        <div
          className={`font-black ${large ? "text-5xl" : "text-3xl"} ${
            userWins ? "text-[#198754]" : "text-[#232323]"
          }`}
        >
          {userValue}
        </div>
      </div>

      {/* VS Divider */}
      <div className="text-2xl font-black text-[#232323]/30">vs</div>

      {/* Rival Side */}
      <div
        className={`flex-1 text-center p-6 rounded-xl border-2 transition-all ${
          rivalWins
            ? "border-[#198754] bg-[#198754]/5 animate-winner-pulse"
            : "border-[#232323]/10 bg-[#B3D8F5]/10"
        }`}
      >
        {rivalLabel && (
          <p className="text-sm text-[#232323]/60 mb-2">{rivalLabel}</p>
        )}
        <div
          className={`font-black ${large ? "text-5xl" : "text-3xl"} ${
            rivalWins ? "text-[#198754]" : "text-[#232323]"
          }`}
        >
          {rivalValue}
        </div>
      </div>
    </div>
  );
}
