import { ImageResponse } from "next/og"

export const alt = "LUPUS BETS — Analiza, nie przeczucie"
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
          padding: "90px",
          background: "#05070B",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", gap: 20, fontSize: 88, fontWeight: 800, letterSpacing: -3 }}>
          <span>LUPUS</span>
          <span style={{ color: "#58E6F5" }}>BETS</span>
        </div>

        <div style={{ marginTop: 28, fontSize: 52, fontWeight: 700, color: "#58E6F5" }}>
          Analiza, nie przeczucie
        </div>

        <div style={{ marginTop: 56, display: "flex", fontSize: 30, fontWeight: 600, color: "rgba(255,255,255,0.7)" }}>
          50%+ trafień · +24% ROI · Q-Score 66
        </div>
      </div>
    ),
    size,
  )
}
