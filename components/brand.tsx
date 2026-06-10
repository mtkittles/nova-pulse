import Link from "next/link"
import Image from "next/image"

// Sygnet (głowa ogara) — nagłówek, favicon-zastępnik.
export function OgarMark({ size = 40 }: { size?: number }) {
  return (
    <Image
      src="/brand/lupus-bets-mark.png"
      width={size}
      height={size}
      alt="Lupus Bets"
      priority
      className="object-contain"
    />
  )
}

// Logo poziome — hero, share, emaile.
export function OgarHorizontal({ height = 48 }: { height?: number }) {
  return (
    <Image
      src="/brand/lupus-bets-horizontal.png"
      width={Math.round(height * 4.5)}
      height={height}
      alt="Lupus Bets"
      priority
      className="object-contain"
    />
  )
}

// Logo pionowe — karty, social media.
export function OgarStacked({ width = 200 }: { width?: number }) {
  return (
    <Image
      src="/brand/lupus-bets-stacked.png"
      width={width}
      height={Math.round(width * 1.1)}
      alt="Lupus Bets"
      priority
      className="object-contain"
    />
  )
}

// Lockup nagłówka: sygnet w kwadracie + napis.
export function Brand({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="group flex items-center gap-3">
      <span className="grid h-10 w-10 place-items-center overflow-hidden rounded-2xl border border-white/15 bg-white/10 backdrop-blur transition group-hover:scale-105 md:h-11 md:w-11">
        <OgarMark size={36} />
      </span>
      <span className="text-xl font-semibold tracking-tight text-white">
        LUPUS <span className="text-[color:var(--accent)]">BETS</span>
      </span>
    </Link>
  )
}
