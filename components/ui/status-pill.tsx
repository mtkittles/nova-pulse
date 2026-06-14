import { Badge, type BadgeTone } from "./badge"

// StatusPill — stan typu/meczu. LIVE = mały pulsujący znacznik (czerwony).
export type PillStatus = "PENDING" | "LIVE" | "WON" | "LOST" | "VOID"

const MAP: Record<PillStatus, { tone: BadgeTone; label: string }> = {
  PENDING: { tone: "neutral", label: "Oczekuje" },
  LIVE: { tone: "danger", label: "LIVE" },
  WON: { tone: "success", label: "Trafiony" },
  LOST: { tone: "danger", label: "Pudło" },
  VOID: { tone: "neutral", label: "Zwrot" },
}

export function StatusPill({ status, className = "" }: { status: PillStatus; className?: string }) {
  const { tone, label } = MAP[status]
  return (
    <Badge tone={tone} className={className}>
      {status === "LIVE" && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--danger)]" />}
      {status === "WON" && "✓ "}
      {status === "LOST" && "✗ "}
      {label}
    </Badge>
  )
}
