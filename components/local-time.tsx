"use client"

import { useEffect, useState } from "react"

// Sformatowana data/godzina w strefie urządzenia (zero hardkodu strefy).
export function LocalDateTime({ iso }: { iso: string | null }) {
  const [txt, setTxt] = useState("")
  useEffect(() => {
    if (!iso) return
    const d = new Date(iso)
    if (!Number.isNaN(d.getTime())) {
      setTxt(new Intl.DateTimeFormat("pl-PL", { dateStyle: "medium", timeStyle: "short" }).format(d))
    }
  }, [iso])
  return <>{txt || "—"}</>
}
