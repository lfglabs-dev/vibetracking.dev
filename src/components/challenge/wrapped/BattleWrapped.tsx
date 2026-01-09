"use client";

import { useState, useEffect, useCallback } from "react";
import { SlideNavigation } from "./SlideNavigation";
import { SlideTokens } from "./SlideTokens";
import { SlideSessions } from "./SlideSessions";
import { SlideStreak } from "./SlideStreak";
import { SlideLoadout } from "./SlideLoadout";
import { SlideBonus } from "./SlideBonus";
import { SlideFinal } from "./SlideFinal";
import { useSlideAnimation } from "@/hooks/useSlideAnimation";
import type { DisplayUnit } from "@/components/dashboard/UnitToggle";
import type { BattleStats, BattleResult } from "@/lib/challenges";

interface BattleWrappedProps {
  challenger: BattleStats;
  challenged: BattleStats;
  result: BattleResult;
  battleSlug: string;
}

const TOTAL_SLIDES = 6;

export function BattleWrapped({
  challenger,
  challenged,
  result,
  battleSlug,
}: BattleWrappedProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [displayUnit, setDisplayUnit] = useState<DisplayUnit>("usd"); // Default to USD
  const { animationKey } = useSlideAnimation({ slideIndex: currentSlide });

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://vibetracking.dev";
  const battleUrl = `${baseUrl}/battle/${battleSlug}`;

  // Navigation handlers
  const goToPrev = useCallback(() => {
    setCurrentSlide((prev) => Math.max(0, prev - 1));
  }, []);

  const goToNext = useCallback(() => {
    setCurrentSlide((prev) => Math.min(TOTAL_SLIDES - 1, prev + 1));
  }, []);

  const goToSlide = useCallback((index: number) => {
    setCurrentSlide(Math.max(0, Math.min(TOTAL_SLIDES - 1, index)));
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        goToPrev();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        goToNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goToPrev, goToNext]);

  // Render current slide
  const renderSlide = () => {
    const props = {
      user: challenger,
      rival: challenged,
      animationKey,
    };

    switch (currentSlide) {
      case 0:
        return <SlideTokens {...props} displayUnit={displayUnit} onDisplayUnitChange={setDisplayUnit} />;
      case 1:
        return <SlideSessions {...props} />;
      case 2:
        return <SlideStreak {...props} />;
      case 3:
        return <SlideLoadout {...props} />;
      case 4:
        return <SlideBonus {...props} />;
      case 5:
        return <SlideFinal {...props} result={result} battleUrl={battleUrl} />;
      default:
        return <SlideTokens {...props} displayUnit={displayUnit} onDisplayUnitChange={setDisplayUnit} />;
    }
  };

  const challengerName = challenger.displayName || challenger.username;
  const challengedName = challenged.displayName || challenged.username;

  return (
    <div className="battle-wrapper">
      <div className="battle-wrapper-content">
        <div className="max-w-3xl mx-auto w-full">
          {/* Player Names Header - Outside Card */}
          <div className="flex items-center justify-center gap-4 mb-4 animate-initial animate-slide-up">
            {/* Challenger */}
            <div className="flex items-center gap-2">
              {challenger.avatarUrl ? (
                <img
                  src={challenger.avatarUrl}
                  alt={challengerName}
                  className="w-10 h-10 rounded-full border-2 border-[#FEA6CC]"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-[#FEA6CC] border-2 border-[#232323]/20 flex items-center justify-center font-bold text-base">
                  {challengerName.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="font-bold text-base">{challengerName}</span>
            </div>

            {/* VS Badge */}
            <div className="w-10 h-10 bg-[#232323] rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white font-black text-xs">VS</span>
            </div>

            {/* Challenged */}
            <div className="flex items-center gap-2">
              <span className="font-bold text-base">{challengedName}</span>
              {challenged.avatarUrl ? (
                <img
                  src={challenged.avatarUrl}
                  alt={challengedName}
                  className="w-10 h-10 rounded-full border-2 border-[#B3D8F5]"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-[#B3D8F5] border-2 border-[#232323]/20 flex items-center justify-center font-bold text-base">
                  {challengedName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          </div>

          {/* Slide Content */}
          <div className="mb-4">{renderSlide()}</div>

          {/* Navigation */}
          <SlideNavigation
            currentSlide={currentSlide}
            totalSlides={TOTAL_SLIDES}
            onPrev={goToPrev}
            onNext={goToNext}
            onGoToSlide={goToSlide}
          />
        </div>
      </div>
    </div>
  );
}
