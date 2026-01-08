import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "Vibetracking - Track your AI coding vibes";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image() {
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
            padding: "60px 100px",
            border: "4px solid #232323",
            boxShadow: "8px 8px 0px 0px #232323",
          }}
        >
          {/* Logo */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "32px",
            }}
          >
            <span
              style={{
                fontSize: "72px",
                fontWeight: "bold",
                color: "#FEA6CC",
              }}
            >
              vibe
            </span>
            <span
              style={{
                fontSize: "72px",
                fontWeight: "bold",
                color: "#AAE7C0",
              }}
            >
              tracking
            </span>
          </div>

          {/* Tagline */}
          <div
            style={{
              fontSize: "32px",
              color: "#232323",
              marginBottom: "48px",
            }}
          >
            Track your AI coding vibes
          </div>

          {/* Tool icons row */}
          <div
            style={{
              display: "flex",
              gap: "32px",
              alignItems: "center",
            }}
          >
            {/* Claude */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "12px",
              }}
            >
              <div
                style={{
                  width: "80px",
                  height: "80px",
                  borderRadius: "16px",
                  backgroundColor: "#FEA6CC",
                  border: "3px solid #232323",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "32px",
                  fontWeight: "bold",
                  color: "#232323",
                }}
              >
                C
              </div>
              <span style={{ fontSize: "18px", color: "#232323" }}>Claude</span>
            </div>

            {/* Cursor */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "12px",
              }}
            >
              <div
                style={{
                  width: "80px",
                  height: "80px",
                  borderRadius: "16px",
                  backgroundColor: "#B3D8F5",
                  border: "3px solid #232323",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "32px",
                  fontWeight: "bold",
                  color: "#232323",
                }}
              >
                Cu
              </div>
              <span style={{ fontSize: "18px", color: "#232323" }}>Cursor</span>
            </div>

            {/* Codex */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "12px",
              }}
            >
              <div
                style={{
                  width: "80px",
                  height: "80px",
                  borderRadius: "16px",
                  backgroundColor: "#AAE7C0",
                  border: "3px solid #232323",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "32px",
                  fontWeight: "bold",
                  color: "#232323",
                }}
              >
                Cx
              </div>
              <span style={{ fontSize: "18px", color: "#232323" }}>Codex</span>
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
