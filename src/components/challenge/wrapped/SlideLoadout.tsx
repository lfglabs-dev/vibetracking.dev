"use client";

import { BattleSlide } from "./BattleSlide";
import { BattleSticker } from "./BattleSticker";
import { formatModelName } from "@/lib/formatModelName";
import type { BattleStats } from "@/lib/challenges";

interface SlideLoadoutProps {
  user: BattleStats;
  rival: BattleStats;
  animationKey: number;
}

// Format tool name for display
function formatToolName(tool: string | null): string {
  if (!tool) return "Unknown";
  const toolMap: Record<string, string> = {
    claude: "Claude Code",
    codex: "Codex",
    cursor: "Cursor",
  };
  return toolMap[tool.toLowerCase()] || tool;
}

export function SlideLoadout({
  user,
  rival,
  animationKey,
}: SlideLoadoutProps) {
  return (
    <BattleSlide
      user={user}
      rival={rival}
      slideIndex={3}
      totalSlides={6}
      title="Round 5: Models"
      animationKey={animationKey}
      sticker={
        <BattleSticker
          imageSrc="/stickers/jensen.webp"
          quote="I don't care they all use me"
          position="inline"
          stickerDelay={0}
          bubbleDelay={100}
          stickerSize={160}
          bubbleSize="large"
        />
      }
    >
      <div className="flex items-stretch justify-center gap-6 w-full px-4">
        {/* User Loadout */}
        <div className="flex-1 min-w-0">
          <div className="bg-[#FEA6CC]/10 border-2 border-[#232323]/10 rounded-xl p-4 h-full">
            <div className="space-y-3">
              {/* Best Model */}
              <div>
                <p className="text-xs text-[#232323]/60 uppercase tracking-wide mb-1">
                  Best Model
                </p>
                <div className="tag tag-pink text-xs truncate max-w-full">
                  {user.favoriteModel
                    ? formatModelName(user.favoriteModel)
                    : "Unknown"}
                </div>
              </div>

              {/* Best Tool */}
              <div>
                <p className="text-xs text-[#232323]/60 uppercase tracking-wide mb-1">
                  Best Tool
                </p>
                <div className="tag tag-blue text-xs">
                  {formatToolName(user.favoriteTool)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* VS Divider */}
        <div className="flex items-center flex-shrink-0">
          <span className="text-xl font-black text-[#232323]/30">vs</span>
        </div>

        {/* Rival Loadout */}
        <div className="flex-1 min-w-0">
          <div className="bg-[#B3D8F5]/10 border-2 border-[#232323]/10 rounded-xl p-4 h-full">
            <div className="space-y-3">
              {/* Best Model */}
              <div>
                <p className="text-xs text-[#232323]/60 uppercase tracking-wide mb-1">
                  Best Model
                </p>
                <div className="tag tag-pink text-xs truncate max-w-full">
                  {rival.favoriteModel
                    ? formatModelName(rival.favoriteModel)
                    : "Unknown"}
                </div>
              </div>

              {/* Best Tool */}
              <div>
                <p className="text-xs text-[#232323]/60 uppercase tracking-wide mb-1">
                  Best Tool
                </p>
                <div className="tag tag-blue text-xs">
                  {formatToolName(rival.favoriteTool)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </BattleSlide>
  );
}
