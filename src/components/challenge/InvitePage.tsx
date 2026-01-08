"use client";

import Link from "next/link";
import { formatCompactNumber, type BattleStats } from "@/lib/challenges";
import { AnimatedSticker } from "@/components/shared/AnimatedSticker";

interface InvitePageProps {
  challenger: BattleStats;
}

// Sticker positions around the card (200% bigger with more spacing)
const cardStickers = [
  { src: "/stickers/vibe.webp", className: "absolute -top-20 -left-28 -rotate-12", size: 160, delay: 100 },
  { src: "/stickers/rainbow.webp", className: "absolute -top-16 -right-24 rotate-12", size: 144, delay: 200 },
  { src: "/stickers/cursor.webp", className: "absolute top-1/4 -left-32 -rotate-6", size: 128, delay: 300 },
  { src: "/stickers/elon.webp", className: "absolute top-1/3 -right-28 rotate-6", size: 128, delay: 400 },
  { src: "/stickers/cloud.webp", className: "absolute -bottom-20 -left-24 rotate-12", size: 144, delay: 500 },
  { src: "/stickers/jensen.webp", className: "absolute -bottom-16 -right-28 -rotate-12", size: 160, delay: 600 },
];

// Extra stickers scattered around the page
const pageStickers = [
  { src: "/stickers/banana.webp", className: "fixed top-8 left-8 rotate-12", size: 120, delay: 700 },
  { src: "/stickers/marck.webp", className: "fixed top-12 right-12 -rotate-6", size: 140, delay: 800 },
  { src: "/stickers/no_em_dashes.webp", className: "fixed bottom-24 left-12 rotate-6", size: 130, delay: 900 },
  { src: "/stickers/vibe.webp", className: "fixed bottom-16 right-8 -rotate-12", size: 110, delay: 1000 },
  { src: "/stickers/rainbow.webp", className: "fixed top-1/3 left-4 rotate-12", size: 100, delay: 1100 },
  { src: "/stickers/cloud.webp", className: "fixed top-1/2 right-4 -rotate-6", size: 110, delay: 1200 },
];

export function InvitePage({ challenger }: InvitePageProps) {
  const challengerName = challenger.displayName || challenger.username;

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 overflow-hidden">
      {/* Page stickers scattered around */}
      {pageStickers.map((sticker, index) => (
        <AnimatedSticker
          key={`page-${index}`}
          src={sticker.src}
          width={sticker.size}
          height={sticker.size}
          className={sticker.className}
          delay={sticker.delay}
        />
      ))}

      <div className="relative max-w-md w-full">
        {/* Stickers around the card */}
        {cardStickers.map((sticker, index) => (
          <AnimatedSticker
            key={`card-${index}`}
            src={sticker.src}
            width={sticker.size}
            height={sticker.size}
            className={sticker.className}
            delay={sticker.delay}
          />
        ))}

        {/* Challenger Card */}
        <div className="card relative z-10">
          <div className="text-center">
            {/* Avatar */}
            <div className="relative inline-block mb-4">
              {challenger.avatarUrl ? (
                <img
                  src={challenger.avatarUrl}
                  alt={challengerName}
                  className="w-24 h-24 rounded-full border-4 border-[#198754] ring-4 ring-[#198754]/30"
                />
              ) : (
                <div className="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold bg-[#FEA6CC] border-4 border-[#198754] ring-4 ring-[#198754]/30">
                  {challengerName.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="absolute -top-2 -right-2 text-3xl">⚡</div>
            </div>

            <h2 className="text-2xl font-bold mb-1">{challengerName}</h2>
            <p className="text-[#232323]/60 mb-4">@{challenger.username}</p>

            <p className="text-lg font-medium text-[#232323]/80 mb-6">
              Think you can beat my AI coding stats?
            </p>
          </div>

          {/* Challenger Stats Preview */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center p-3 bg-[#EEF0F2] rounded-lg">
              <div className="text-xl font-black text-[#D63384]">
                ${challenger.estimatedSpend.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </div>
              <div className="text-xs text-[#232323]/60">API Spend</div>
            </div>
            <div className="text-center p-3 bg-[#EEF0F2] rounded-lg">
              <div className="text-xl font-black text-[#0D6EFD]">
                {formatCompactNumber(challenger.totalTokens)}
              </div>
              <div className="text-xs text-[#232323]/60">Tokens</div>
            </div>
            <div className="text-center p-3 bg-[#EEF0F2] rounded-lg">
              <div className="text-xl font-black text-[#198754]">
                {challenger.currentStreak}
              </div>
              <div className="text-xs text-[#232323]/60">Day Streak</div>
            </div>
          </div>

          {/* CTA for visitors */}
          <div className="text-center">
            <p className="text-sm text-[#232323]/60 mb-4">
              Import your stats and see who wins!
            </p>
            <Link
              href={`/import?challenge=${challenger.username}`}
              className="inline-flex items-center gap-2 bg-[#198754] text-white px-6 py-3 rounded-lg border-2 border-[#232323] hover:bg-[#198754]/90 transition-colors font-bold text-lg"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
              Accept Challenge
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}
