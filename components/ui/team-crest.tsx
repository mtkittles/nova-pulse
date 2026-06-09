import Image from "next/image"
import { teamInitials } from "@/lib/design"

// Herb drużyny: logo z API (jeśli jest) z fallbackiem na inicjały.
// Bez logo renderuje kółko z inicjałami i deterministycznym odcieniem.
function hue(name: string): number {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 360
  return h
}

export function TeamCrest({
  name,
  logo,
  size = 36,
}: {
  name: string
  logo?: string | null
  size?: number
}) {
  if (logo) {
    return (
      <span
        className="grid shrink-0 place-items-center overflow-hidden rounded-full border border-white/12 bg-white/10"
        style={{ width: size, height: size }}
      >
        <Image src={logo} alt={name} width={size} height={size} className="h-full w-full object-contain p-1" />
      </span>
    )
  }
  const h = hue(name || "?")
  return (
    <span
      className="grid shrink-0 place-items-center rounded-full border border-white/15 font-semibold text-white"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.36,
        background: `linear-gradient(135deg, hsla(${h},70%,45%,0.55), hsla(${(h + 40) % 360},70%,35%,0.55))`,
      }}
      aria-hidden
    >
      {teamInitials(name)}
    </span>
  )
}
