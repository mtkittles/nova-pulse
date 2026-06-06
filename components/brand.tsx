import Link from "next/link"
import { WolfLogo } from "./wolf-logo"

export function Brand({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="group flex items-center gap-3">
      <span className="grid h-11 w-11 place-items-center rounded-2xl border border-white/15 bg-white/10 backdrop-blur transition group-hover:scale-105">
        <WolfLogo className="h-6 w-6" />
      </span>
      <span className="text-xl font-semibold tracking-tight text-white">
        LUPUS <span className="text-[color:var(--accent)]">BETS</span>
      </span>
    </Link>
  )
}
