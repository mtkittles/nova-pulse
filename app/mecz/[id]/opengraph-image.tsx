import { ImageResponse } from "next/og"
import { getMatchDetailed } from "@/lib/match"
import { getMarketLabel } from "@/lib/market-label"
import { fmtEdge, fmtQ } from "@/lib/format"

export const alt = "Mecz — LUPUS BETS"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

// Data meczu w strefie Warszawy, krótki format "DD.MM · HH:MM".
function fmtKickoff(iso: string | null | undefined): string {
  if (!iso) return ""
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ""
  return new Intl.DateTimeFormat("pl-PL", {
    timeZone: "Europe/Warsaw",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d).replace(",", " ·")
}

function isHttp(u: string | null | undefined): u is string {
  return typeof u === "string" && /^https?:\/\//.test(u)
}

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const m = await getMatchDetailed(id)

  // główna rekomendacja: is_primary z Oracle, fallback max Q-Score
  const primary =
    m.predictions.find((p) => p.is_primary) ??
    m.predictions.reduce<(typeof m.predictions)[number] | undefined>(
      (acc, p) => ((p.q_score ?? -1) > (acc?.q_score ?? -1) ? p : acc),
      undefined,
    )
  const market = primary ? getMarketLabel(primary.bet_type_raw ?? primary.bet_type, primary.bet_side_raw ?? primary.bet_side, m.home, m.away) : null
  const recLine = primary
    ? [market?.short, `Q ${fmtQ(primary.q_score)}`, `${fmtEdge(primary.edge)} edge`].filter(Boolean).join(" · ")
    : ""

  const Crest = ({ logo, name }: { logo: string | null | undefined; name: string }) =>
    isHttp(logo) ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={logo} width={160} height={160} alt={name} style={{ objectFit: "contain" }} />
    ) : (
      <div
        style={{
          width: 160,
          height: 160,
          borderRadius: 80,
          background: "rgba(255,255,255,0.06)",
          border: "2px solid rgba(255,255,255,0.14)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 64,
          fontWeight: 800,
        }}
      >
        {name.slice(0, 1).toUpperCase()}
      </div>
    )

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          padding: "70px 80px",
          background: "#05070B",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        {/* nagłówek: marka + liga */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 28 }}>
          <div style={{ display: "flex", gap: 12, fontWeight: 800, letterSpacing: -1 }}>
            <span>LUPUS</span>
            <span style={{ color: "#58E6F5" }}>BETS</span>
          </div>
          <span style={{ color: "rgba(255,255,255,0.6)" }}>{m.league || "—"}</span>
        </div>

        {/* drużyny + herby */}
        <div style={{ display: "flex", flex: 1, alignItems: "center", justifyContent: "space-between", marginTop: 20 }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 360 }}>
            <Crest logo={m.homeLogo} name={m.home} />
            <span style={{ marginTop: 20, fontSize: 38, fontWeight: 700, textAlign: "center" }}>{m.home}</span>
          </div>
          <span style={{ fontSize: 44, fontWeight: 800, color: "rgba(255,255,255,0.45)" }}>vs</span>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 360 }}>
            <Crest logo={m.awayLogo} name={m.away} />
            <span style={{ marginTop: 20, fontSize: 38, fontWeight: 700, textAlign: "center" }}>{m.away}</span>
          </div>
        </div>

        {/* stopka: kickoff + rekomendacja bota */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 30 }}>
          <span style={{ color: "rgba(255,255,255,0.6)" }}>{fmtKickoff(m.kickoff_utc)}</span>
          {recLine ? (
            <span style={{ display: "flex", color: "#58E6F5", fontWeight: 700 }}>{recLine}</span>
          ) : (
            <span />
          )}
        </div>
      </div>
    ),
    size,
  )
}
