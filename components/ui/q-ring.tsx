"use client"

import { motion } from "framer-motion"
import { qColor } from "@/lib/design"

// Pierścień Q-Score — kolorowy postęp (skala czerwony→zielony) z liczbą w środku.
export function QRing({
  value,
  size = 56,
  stroke = 5,
  label = "Q",
}: {
  value: number // 0..100
  size?: number
  stroke?: number
  label?: string
}) {
  const v = Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0))
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const color = qColor(v)

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={stroke} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          whileInView={{ strokeDashoffset: c - (v / 100) * c }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-sm font-semibold leading-none" style={{ color }}>
          {Math.round(v)}
        </span>
        <span className="mt-0.5 text-[8px] uppercase tracking-wider text-white/55">{label}</span>
      </div>
    </div>
  )
}
