import { ImageResponse } from "next/og";
import { createClient } from "@supabase/supabase-js";

export const runtime = "edge";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Get user profile by anonymous_id
  const { data: user } = await supabase
    .from("users")
    .select("*")
    .eq("anonymous_id", id)
    .single();

  if (!user) {
    return new Response("User not found", { status: 404 });
  }

  // Get user stats
  const { data: stats } = await supabase
    .from("user_stats")
    .select("*")
    .eq("user_id", user.id)
    .single();

  const displayName = user.display_name || `Anonymous #${id.slice(0, 8)}`;
  const totalTokens = stats?.total_tokens || 0;
  const totalSessions = stats?.total_sessions || 0;
  const currentStreak = stats?.current_streak_days || 0;

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
            borderRadius: "20px",
            padding: "60px 80px",
            border: "4px solid #232323",
            boxShadow: "8px 8px 0px 0px #232323",
          }}
        >
          {/* Avatar */}
          <div
            style={{
              width: "120px",
              height: "120px",
              borderRadius: "60px",
              backgroundColor: "#FEA6CC",
              border: "4px solid #232323",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "48px",
              fontWeight: "bold",
              color: "#232323",
              marginBottom: "24px",
            }}
          >
            {displayName.charAt(0).toUpperCase()}
          </div>

          {/* Name */}
          <div
            style={{
              fontSize: "48px",
              fontWeight: "bold",
              color: "#232323",
              marginBottom: "8px",
            }}
          >
            {displayName}
          </div>

          {/* ID */}
          <div
            style={{
              fontSize: "24px",
              color: "#232323",
              opacity: 0.6,
              marginBottom: "40px",
            }}
          >
            Anonymous #{id.slice(0, 8)}
          </div>

          {/* Stats Row */}
          <div
            style={{
              display: "flex",
              gap: "40px",
            }}
          >
            {/* Total Tokens */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <div
                style={{
                  fontSize: "36px",
                  fontWeight: "bold",
                  color: "#FEA6CC",
                }}
              >
                {formatNumber(totalTokens)}
              </div>
              <div
                style={{
                  fontSize: "16px",
                  color: "#232323",
                  opacity: 0.6,
                }}
              >
                tokens
              </div>
            </div>

            {/* Sessions */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <div
                style={{
                  fontSize: "36px",
                  fontWeight: "bold",
                  color: "#B3D8F5",
                }}
              >
                {formatNumber(totalSessions)}
              </div>
              <div
                style={{
                  fontSize: "16px",
                  color: "#232323",
                  opacity: 0.6,
                }}
              >
                sessions
              </div>
            </div>

            {/* Streak */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <div
                style={{
                  fontSize: "36px",
                  fontWeight: "bold",
                  color: "#AAE7C0",
                }}
              >
                {currentStreak}
              </div>
              <div
                style={{
                  fontSize: "16px",
                  color: "#232323",
                  opacity: 0.6,
                }}
              >
                streak
              </div>
            </div>
          </div>

          {/* Logo */}
          <div
            style={{
              marginTop: "40px",
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
    }
  );
}

function formatNumber(num: number): string {
  if (num >= 1_000_000_000) {
    return (num / 1_000_000_000).toFixed(1) + "B";
  }
  if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(1) + "M";
  }
  if (num >= 1_000) {
    return (num / 1_000).toFixed(1) + "K";
  }
  return num.toString();
}
