"use client";

import type { CSSProperties } from "react";

export type TailDirection = "left" | "right" | "bottom-left" | "bottom-right";
export type BubbleSize = "default" | "large" | "xlarge";

interface SpeechBubbleProps {
  text: string;
  tailDirection: TailDirection;
  className?: string;
  animationDelay?: number;
  rotate?: number;
  size?: BubbleSize;
}

const sizeClasses: Record<BubbleSize, string> = {
  default: "",
  large: "speech-bubble-large",
  xlarge: "speech-bubble-xlarge",
};

export function SpeechBubble({
  text,
  tailDirection,
  className = "",
  animationDelay = 0,
  rotate = -3,
  size = "default",
}: SpeechBubbleProps) {
  const tailClass = `speech-bubble-tail-${tailDirection}`;
  const sizeClass = sizeClasses[size];

  return (
    <div
      className={`speech-bubble ${tailClass} ${sizeClass} animate-initial animate-pop-in ${className}`}
      style={
        {
          animationDelay: `${animationDelay}ms`,
          "--bubble-rotate": `${rotate}deg`,
        } as CSSProperties
      }
    >
      {text}
    </div>
  );
}
