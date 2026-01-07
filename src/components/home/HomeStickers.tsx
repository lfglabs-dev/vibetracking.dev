"use client";

import { AnimatedSticker } from "@/components/shared/AnimatedSticker";

interface HomeStickerProps {
  leaderboardCount: number;
}

// Sticker configuration - each sticker appears after a certain leaderboard threshold
// More entries = more stickers, rewarding larger leaderboards
const STICKER_CONFIG = [
  // Always visible (threshold 1) - Top section near header
  {
    threshold: 1,
    src: "/stickers/vibe.webp",
    width: 180,
    height: 180,
    className:
      "absolute top-[80px] -left-28 md:-left-48 lg:-left-60 w-32 md:w-44 rotate-[-12deg] hidden sm:block drop-shadow-lg",
    delay: 100,
  },
  {
    threshold: 1,
    src: "/stickers/rainbow.webp",
    width: 180,
    height: 180,
    className:
      "absolute top-[70px] -right-28 md:-right-48 lg:-right-60 w-32 md:w-44 rotate-[15deg] hidden sm:block drop-shadow-lg",
    delay: 200,
  },
  // CTA section - visible with 3+ entries
  {
    threshold: 3,
    src: "/stickers/cloud.webp",
    width: 120,
    height: 120,
    className:
      "absolute top-[240px] -left-24 md:-left-40 lg:-left-52 w-24 md:w-32 rotate-[8deg] hidden md:block drop-shadow-lg",
    delay: 300,
  },
  {
    threshold: 3,
    src: "/stickers/banana.webp",
    width: 140,
    height: 140,
    className:
      "absolute top-[260px] -right-28 md:-right-44 lg:-right-56 w-28 md:w-36 rotate-[-8deg] hidden md:block drop-shadow-lg",
    delay: 400,
  },
  // Leaderboard top section - visible with 5+ entries
  {
    threshold: 5,
    src: "/stickers/cursor.webp",
    width: 140,
    height: 140,
    className:
      "absolute top-[440px] -left-28 md:-left-44 lg:-left-56 w-28 md:w-36 rotate-[10deg] hidden md:block drop-shadow-lg",
    delay: 500,
  },
  {
    threshold: 5,
    src: "/stickers/jensen.webp",
    width: 150,
    height: 150,
    className:
      "absolute top-[470px] -right-28 md:-right-48 lg:-right-60 w-30 md:w-40 rotate-[-10deg] hidden md:block drop-shadow-lg",
    delay: 600,
  },
  // Leaderboard middle section - visible with 7+ entries
  {
    threshold: 7,
    src: "/stickers/cloud.webp",
    width: 100,
    height: 100,
    className:
      "absolute top-[670px] -right-24 md:-right-36 lg:-right-48 w-20 md:w-28 rotate-[12deg] hidden lg:block drop-shadow-lg",
    delay: 700,
  },
  {
    threshold: 7,
    src: "/stickers/no_em_dashes.webp",
    width: 150,
    height: 150,
    className:
      "absolute top-[720px] -left-28 md:-left-44 lg:-left-56 w-30 md:w-40 rotate-[-6deg] hidden lg:block drop-shadow-lg",
    delay: 800,
  },
  // Leaderboard lower section - visible with 10+ entries
  {
    threshold: 10,
    src: "/stickers/elon.webp",
    width: 140,
    height: 140,
    className:
      "absolute top-[920px] -right-28 md:-right-44 lg:-right-56 w-28 md:w-36 rotate-[8deg] hidden lg:block drop-shadow-lg",
    delay: 900,
  },
  {
    threshold: 10,
    src: "/stickers/rainbow.webp",
    width: 120,
    height: 120,
    className:
      "absolute top-[970px] -left-24 md:-left-40 lg:-left-52 w-24 md:w-32 rotate-[-10deg] hidden lg:block drop-shadow-lg",
    delay: 1000,
  },
  // Bottom section - visible with 15+ entries (premium tier)
  {
    threshold: 15,
    src: "/stickers/marck.webp",
    width: 140,
    height: 140,
    className:
      "absolute top-[1170px] -left-28 md:-left-44 lg:-left-56 w-28 md:w-36 rotate-[12deg] hidden lg:block drop-shadow-lg",
    delay: 1100,
  },
  {
    threshold: 15,
    src: "/stickers/cloud.webp",
    width: 100,
    height: 100,
    className:
      "absolute top-[1220px] -right-24 md:-right-36 lg:-right-48 w-20 md:w-28 rotate-[-8deg] hidden lg:block drop-shadow-lg",
    delay: 1200,
  },
];

export function HomeStickers({ leaderboardCount }: HomeStickerProps) {
  // Filter stickers based on leaderboard count
  const visibleStickers = STICKER_CONFIG.filter(
    (sticker) => leaderboardCount >= sticker.threshold
  );

  return (
    <div
      className="pointer-events-none select-none absolute inset-0 z-0 overflow-visible"
      aria-hidden="true"
    >
      {visibleStickers.map((sticker, index) => (
        <AnimatedSticker
          key={`${sticker.src}-${index}`}
          src={sticker.src}
          width={sticker.width}
          height={sticker.height}
          className={sticker.className}
          delay={sticker.delay}
        />
      ))}
    </div>
  );
}
