"use client";

import Image from "next/image";
import { SpeechBubble, type TailDirection, type BubbleSize } from "./SpeechBubble";
import type { CSSProperties } from "react";

export type StickerPosition = "top-right" | "bottom-right" | "bottom-left" | "inline";

interface BattleStickerProps {
  imageSrc: string;
  quote: string;
  position?: StickerPosition;
  stickerDelay?: number;
  bubbleDelay?: number;
  stickerSize?: number;
  rotate?: number;
  bubbleSize?: BubbleSize;
}

// Map position to appropriate bubble tail direction
const positionToTail: Record<StickerPosition, TailDirection> = {
  "top-right": "bottom-right",
  "bottom-right": "bottom-right",
  "bottom-left": "bottom-left",
  "inline": "bottom-right",
};

// Position styles for absolute positioning
const positionStyles: Record<StickerPosition, string> = {
  "top-right": "top-4 right-4",
  "bottom-right": "bottom-4 right-4",
  "bottom-left": "bottom-4 left-4",
  "inline": "",
};

export function BattleSticker({
  imageSrc,
  quote,
  position = "bottom-right",
  stickerDelay = 500,
  bubbleDelay = 650,
  stickerSize = 100,
  rotate = 6,
  bubbleSize = "default",
}: BattleStickerProps) {
  const tailDirection = positionToTail[position];
  const positionClass = positionStyles[position];

  // Inline layout - sticker and bubble side by side
  if (position === "inline") {
    return (
      <div className="flex items-center justify-center gap-4 pointer-events-none select-none">
        {/* Sticker Image */}
        <Image
          src={imageSrc}
          alt=""
          width={stickerSize}
          height={stickerSize}
          className="animate-initial animate-bounce-in flex-shrink-0"
          style={
            {
              animationDelay: `${stickerDelay}ms`,
              transform: `rotate(${rotate}deg)`,
              "--sticker-scale": "1",
              "--tw-rotate": `${rotate}deg`,
            } as CSSProperties
          }
        />
        {/* Speech Bubble */}
        <SpeechBubble
          text={quote}
          tailDirection="left"
          animationDelay={bubbleDelay}
          rotate={-2}
          size={bubbleSize}
        />
      </div>
    );
  }

  // Absolute positioning for other positions
  const bubblePosition =
    position === "bottom-left"
      ? "left-full ml-2 bottom-1/2 translate-y-1/2"
      : "right-full mr-2 bottom-1/2 translate-y-1/2";

  return (
    <div
      className={`absolute ${positionClass} pointer-events-none select-none z-10`}
      aria-hidden="true"
    >
      {/* Sticker Container */}
      <div className="relative">
        {/* Speech Bubble - positioned to the side of sticker */}
        <div className={`absolute ${bubblePosition}`}>
          <SpeechBubble
            text={quote}
            tailDirection={tailDirection}
            animationDelay={bubbleDelay}
            rotate={position === "bottom-left" ? 3 : -3}
            size={bubbleSize}
          />
        </div>

        {/* Sticker Image */}
        <Image
          src={imageSrc}
          alt=""
          width={stickerSize}
          height={stickerSize}
          className="animate-initial animate-bounce-in"
          style={
            {
              animationDelay: `${stickerDelay}ms`,
              transform: `rotate(${rotate}deg)`,
              "--sticker-scale": "1",
              "--tw-rotate": `${rotate}deg`,
            } as CSSProperties
          }
        />
      </div>
    </div>
  );
}
