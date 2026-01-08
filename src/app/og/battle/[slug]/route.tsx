import { ImageResponse } from "next/og";
import { createClient } from "@supabase/supabase-js";
import { estimateApiSpendUsd } from "@/lib/pricing";
import { parseBattleSlug } from "@/lib/battle";
import {
  getTrashTalkMessage,
  isValidTrashTalkId,
  calculateEstimatedSpend,
  STAT_WEIGHTS,
} from "@/lib/challenges";

export const runtime = "edge";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const url = new URL(request.url);
  const trashParam = url.searchParams.get("trash");

  const parsed = parseBattleSlug(slug);
  if (!parsed) {
    return new Response("Invalid battle URL", { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Get both users by username
  const [challengerResult, challengedResult] = await Promise.all([
    supabase
      .from("users")
      .select("id, username, display_name, avatar_url")
      .eq("username", parsed.user1)
      .single(),
    supabase
      .from("users")
      .select("id, username, display_name, avatar_url")
      .eq("username", parsed.user2)
      .single(),
  ]);

  if (!challengerResult.data || !challengedResult.data) {
    return new Response("Users not found", { status: 404 });
  }

  const challenger = challengerResult.data;
  const challenged = challengedResult.data;

  // Get token usage and user stats for scoring
  const [challengerUsage, challengedUsage, challengerStats, challengedStats] = await Promise.all([
    supabase
      .from("token_usage")
      .select("model, input_tokens, output_tokens")
      .eq("user_id", challenger.id),
    supabase
      .from("token_usage")
      .select("model, input_tokens, output_tokens")
      .eq("user_id", challenged.id),
    supabase
      .from("user_stats")
      .select("total_tokens, total_sessions, current_streak_days, longest_streak_days")
      .eq("user_id", challenger.id)
      .single(),
    supabase
      .from("user_stats")
      .select("total_tokens, total_sessions, current_streak_days, longest_streak_days")
      .eq("user_id", challenged.id)
      .single(),
  ]);

  // Calculate estimated spend
  const challengerSpend = challengerUsage.data
    ? calculateEstimatedSpend(challengerUsage.data, estimateApiSpendUsd)
    : 0;
  const challengedSpend = challengedUsage.data
    ? calculateEstimatedSpend(challengedUsage.data, estimateApiSpendUsd)
    : 0;

  const challengerName = challenger.display_name || challenger.username;
  const challengedName = challenged.display_name || challenged.username;

  // Calculate scores using the same weighted scoring system as the battle page
  let challengerScore = 0;
  let challengedScore = 0;

  const cStats = challengerStats.data as {
    total_tokens?: number;
    total_sessions?: number;
    current_streak_days?: number;
    longest_streak_days?: number;
  } || {};
  const dStats = challengedStats.data as {
    total_tokens?: number;
    total_sessions?: number;
    current_streak_days?: number;
    longest_streak_days?: number;
  } || {};

  // Compare stats and award points based on weights
  const statsToCompare = [
    { key: "estimatedSpend", cVal: challengerSpend, dVal: challengedSpend },
    { key: "totalTokens", cVal: cStats.total_tokens || 0, dVal: dStats.total_tokens || 0 },
    { key: "totalSessions", cVal: cStats.total_sessions || 0, dVal: dStats.total_sessions || 0 },
    { key: "currentStreak", cVal: cStats.current_streak_days || 0, dVal: dStats.current_streak_days || 0 },
    { key: "longestStreak", cVal: cStats.longest_streak_days || 0, dVal: dStats.longest_streak_days || 0 },
  ];

  for (const stat of statsToCompare) {
    const weight = STAT_WEIGHTS[stat.key] || 1;
    if (stat.cVal > stat.dVal) {
      challengerScore += weight;
    } else if (stat.dVal > stat.cVal) {
      challengedScore += weight;
    }
  }

  // Determine winner based on score (matching battle page logic)
  let isChallengerWinner = false;
  let isTie = false;

  if (challengerScore > challengedScore) {
    isChallengerWinner = true;
  } else if (challengedScore > challengerScore) {
    isChallengerWinner = false;
  } else {
    // Tie-breaker: compare estimatedSpend, then totalTokens
    if (challengerSpend > challengedSpend) {
      isChallengerWinner = true;
    } else if (challengedSpend > challengerSpend) {
      isChallengerWinner = false;
    } else if ((cStats.total_tokens || 0) > (dStats.total_tokens || 0)) {
      isChallengerWinner = true;
    } else if ((dStats.total_tokens || 0) > (cStats.total_tokens || 0)) {
      isChallengerWinner = false;
    } else {
      isTie = true;
    }
  }

  // Get trash talk message if provided
  const trashTalkId = trashParam ? parseInt(trashParam, 10) : undefined;
  const trashTalkMessage =
    trashTalkId !== undefined && isValidTrashTalkId(trashTalkId)
      ? getTrashTalkMessage(trashTalkId).shareText
      : undefined;

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#EEF0F2",
          fontFamily: "sans-serif",
        }}
      >
        {/* Card Container */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            backgroundColor: "white",
            borderRadius: "24px",
            padding: "40px 60px",
            border: "4px solid #232323",
            boxShadow: "8px 8px 0px 0px #232323",
          }}
        >
          {/* Battle Banner */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              backgroundColor: "#FEA6CC",
              padding: "10px 20px",
              borderRadius: "12px",
              marginBottom: trashTalkMessage ? "16px" : "30px",
            }}
          >
            <span style={{ fontSize: "24px" }}>⚔️</span>
            <span
              style={{
                fontSize: "20px",
                fontWeight: "bold",
                color: "#232323",
              }}
            >
              BATTLE RESULTS
            </span>
            <span style={{ fontSize: "24px" }}>⚔️</span>
          </div>

          {/* Trash Talk Message */}
          {trashTalkMessage && (
            <div
              style={{
                fontSize: "16px",
                color: "#232323",
                fontStyle: "italic",
                marginBottom: "20px",
                maxWidth: "500px",
                textAlign: "center",
              }}
            >
              &quot;{trashTalkMessage}&quot;
            </div>
          )}

          {/* Fighters Row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "40px",
              marginBottom: "30px",
            }}
          >
            {/* Challenger */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <div style={{ position: "relative", display: "flex" }}>
                {challenger.avatar_url ? (
                  <img
                    src={challenger.avatar_url}
                    width={100}
                    height={100}
                    style={{
                      borderRadius: "50px",
                      border: `4px solid ${isChallengerWinner && !isTie ? "#198754" : "#232323"}`,
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: "100px",
                      height: "100px",
                      borderRadius: "50px",
                      backgroundColor: "#FEA6CC",
                      border: `4px solid ${isChallengerWinner && !isTie ? "#198754" : "#232323"}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "40px",
                      fontWeight: "bold",
                      color: "#232323",
                    }}
                  >
                    {challengerName.charAt(0).toUpperCase()}
                  </div>
                )}
                {isChallengerWinner && !isTie && (
                  <span
                    style={{
                      position: "absolute",
                      top: "-10px",
                      right: "-10px",
                      fontSize: "32px",
                    }}
                  >
                    👑
                  </span>
                )}
              </div>
              <div
                style={{
                  fontSize: "20px",
                  fontWeight: "bold",
                  color: "#232323",
                  marginTop: "12px",
                }}
              >
                {challengerName}
              </div>
              <div
                style={{
                  fontSize: "24px",
                  fontWeight: "bold",
                  color: isChallengerWinner && !isTie ? "#198754" : "#232323",
                  marginTop: "8px",
                }}
              >
                ${Math.round(challengerSpend)}
              </div>
            </div>

            {/* VS */}
            <div
              style={{
                width: "70px",
                height: "70px",
                backgroundColor: "#232323",
                borderRadius: "35px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span
                style={{
                  color: "white",
                  fontWeight: "bold",
                  fontSize: "24px",
                }}
              >
                VS
              </span>
            </div>

            {/* Challenged */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <div style={{ position: "relative", display: "flex" }}>
                {challenged.avatar_url ? (
                  <img
                    src={challenged.avatar_url}
                    width={100}
                    height={100}
                    style={{
                      borderRadius: "50px",
                      border: `4px solid ${!isChallengerWinner && !isTie ? "#198754" : "#232323"}`,
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: "100px",
                      height: "100px",
                      borderRadius: "50px",
                      backgroundColor: "#B3D8F5",
                      border: `4px solid ${!isChallengerWinner && !isTie ? "#198754" : "#232323"}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "40px",
                      fontWeight: "bold",
                      color: "#232323",
                    }}
                  >
                    {challengedName.charAt(0).toUpperCase()}
                  </div>
                )}
                {!isChallengerWinner && !isTie && (
                  <span
                    style={{
                      position: "absolute",
                      top: "-10px",
                      right: "-10px",
                      fontSize: "32px",
                    }}
                  >
                    👑
                  </span>
                )}
              </div>
              <div
                style={{
                  fontSize: "20px",
                  fontWeight: "bold",
                  color: "#232323",
                  marginTop: "12px",
                }}
              >
                {challengedName}
              </div>
              <div
                style={{
                  fontSize: "24px",
                  fontWeight: "bold",
                  color: !isChallengerWinner && !isTie ? "#198754" : "#232323",
                  marginTop: "8px",
                }}
              >
                ${Math.round(challengedSpend)}
              </div>
            </div>
          </div>

          {/* Winner Text */}
          <div
            style={{
              fontSize: "28px",
              fontWeight: "bold",
              color: isTie ? "#232323" : "#198754",
              marginBottom: "20px",
            }}
          >
            {isTie
              ? "🤝 IT'S A TIE!"
              : `🏆 ${isChallengerWinner ? challengerName : challengedName} WINS!`}
          </div>

          {/* Logo */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <span
              style={{
                fontSize: "24px",
                fontWeight: "bold",
                color: "#FEA6CC",
              }}
            >
              vibe
            </span>
            <span
              style={{
                fontSize: "24px",
                fontWeight: "bold",
                color: "#AAE7C0",
              }}
            >
              tracking
            </span>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: {
        "Cache-Control": "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400",
      },
    }
  );
}
