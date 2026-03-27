import { ImageResponse } from "next/og";

export const runtime = "nodejs";

export async function GET() {
  try {
    return new ImageResponse(
      (
        <div
          style={{
            background:
              "linear-gradient(135deg, #0F766E 0%, #115E59 50%, #164E48 100%)",
            width: "1200px",
            height: "630px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "20px",
            padding: "40px",
            fontFamily: "system-ui, -apple-system, sans-serif",
          }}
        >
          {/* Logo/Shield Container */}
          <div
            style={{
              width: "200px",
              height: "200px",
              background: "rgba(255, 255, 255, 0.1)",
              borderRadius: "20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backdropFilter: "blur(10px)",
            }}
          >
            {/* SDS Text Logo */}
            <div
              style={{
                fontSize: "80px",
                fontWeight: "bold",
                color: "white",
                letterSpacing: "8px",
                position: "relative",
              }}
            >
              SDS
            </div>
          </div>

          {/* Main Title */}
          <div
            style={{
              fontSize: "56px",
              fontWeight: "bold",
              color: "white",
              textAlign: "center",
              marginBottom: "10px",
              lineHeight: "1.2",
            }}
          >
            SAFZAN
          </div>

          {/* Subtitle */}
          <div
            style={{
              fontSize: "38px",
              color: "rgba(255, 255, 255, 0.9)",
              textAlign: "center",
              fontWeight: "600",
              marginBottom: "20px",
            }}
          >
            DATA SUB
          </div>

          {/* Tagline */}
          <div
            style={{
              fontSize: "24px",
              color: "rgba(255, 255, 255, 0.8)",
              textAlign: "center",
              maxWidth: "900px",
              marginTop: "10px",
            }}
          >
            Premium Data & Airtime Services
          </div>

          {/* Decorative bottom bar */}
          <div
            style={{
              position: "absolute",
              bottom: "0",
              left: "0",
              width: "100%",
              height: "8px",
              background: "linear-gradient(90deg, #14b8a6 0%, #06b6d4 100%)",
            }}
          />
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (error) {
    console.error("Error generating OG image:", error);
    return new Response("Failed to generate image", { status: 500 });
  }
}
