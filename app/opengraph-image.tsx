import { ImageResponse } from "next/og"

export const alt = "LUPUS BETS — predykcje piłkarskie napędzane modelem"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "linear-gradient(135deg, #070812 0%, #0d1320 60%, #0a1a1f 100%)",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <div
            style={{
              width: 96,
              height: 96,
              borderRadius: 28,
              background: "rgba(255,255,255,0.06)",
              border: "2px solid rgba(103,232,249,0.4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 56,
            }}
          >
            🐺
          </div>
          <div style={{ display: "flex", gap: 16, fontSize: 72, fontWeight: 800, letterSpacing: -2 }}>
            <span>LUPUS</span>
            <span style={{ color: "#67e8f9" }}>BETS</span>
          </div>
        </div>

        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginTop: 40, fontSize: 44, fontWeight: 600, maxWidth: 900, lineHeight: 1.2 }}>
          <span>Mądrzejsze typy.</span>
          <span style={{ color: "#67e8f9" }}>Model, nie przeczucie.</span>
        </div>
        <div style={{ marginTop: 24, fontSize: 28, color: "rgba(255,255,255,0.6)" }}>
          BTTS · Over 1.5 · Mix · Thriller — z oceną Q-Score i realną skutecznością
        </div>
      </div>
    ),
    size,
  )
}
