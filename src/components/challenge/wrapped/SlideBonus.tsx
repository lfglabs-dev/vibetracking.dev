"use client";

import { BattleSlide } from "./BattleSlide";
import { BattleSticker } from "./BattleSticker";
import type { BattleStats } from "@/lib/challenges";

interface SlideBonusProps {
  user: BattleStats;
  rival: BattleStats;
  animationKey: number;
}

export function SlideBonus({ user, rival, animationKey }: SlideBonusProps) {
  return (
    <BattleSlide
      user={user}
      rival={rival}
      slideIndex={4}
      totalSlides={6}
      title="Bonus Round: Nobody used Meta"
      animationKey={animationKey}
      sticker={
        <BattleSticker
          imageSrc="/stickers/marck.webp"
          quote="Do you want 100M USD to use my models?"
          position="inline"
          stickerDelay={0}
          bubbleDelay={100}
          stickerSize={320}
          bubbleSize="xlarge"
        />
      }
    >
      {/* Empty - sticker speaks for itself */}
      <div />
    </BattleSlide>
  );
}
