"use client"

import { useEffect, useState } from "react"
import { Check, Pencil, Send } from "lucide-react"
import { DEFAULT_AVATAR, PROFILE_EVENT, readProfile, writeProfile } from "@/lib/profile-local"
import { Badge } from "@/components/ui/badge"

// [A] Nagłówek profilu — avatar + edytowalny nick (localStorage), tier, Telegram.
export function ProfileIdentity({ defaultNick, tier }: { defaultNick: string; tier: "free" | "premium" }) {
  const [avatar, setAvatar] = useState(DEFAULT_AVATAR)
  const [nick, setNick] = useState(defaultNick)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(defaultNick)

  useEffect(() => {
    const sync = () => {
      const p = readProfile()
      setAvatar(p.avatar)
      setNick(p.nick || defaultNick)
    }
    sync()
    window.addEventListener(PROFILE_EVENT, sync)
    window.addEventListener("storage", sync)
    return () => {
      window.removeEventListener(PROFILE_EVENT, sync)
      window.removeEventListener("storage", sync)
    }
  }, [defaultNick])

  function save() {
    const v = draft.trim().slice(0, 24)
    writeProfile({ nick: v || null })
    setEditing(false)
  }

  return (
    <div className="flex items-center gap-4">
      <span className="grid h-16 w-16 shrink-0 place-items-center rounded-full border-2 border-[color:var(--cyan)] bg-[var(--surface-2)] text-3xl">
        {avatar}
      </span>
      <div className="min-w-0">
        {editing ? (
          <span className="flex items-center gap-2">
            <input
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && save()}
              className="w-40 rounded-lg border border-[color:var(--border-strong)] bg-[var(--surface-2)] px-2 py-1 text-lg font-semibold outline-none"
            />
            <button type="button" onClick={save} aria-label="Zapisz nick" className="text-[color:var(--cyan)]">
              <Check className="h-5 w-5" />
            </button>
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <h1 className="truncate text-2xl font-semibold">{nick}</h1>
            <button
              type="button"
              onClick={() => {
                setDraft(nick)
                setEditing(true)
              }}
              aria-label="Edytuj nick"
              className="text-[color:var(--text-muted)] transition hover:text-[color:var(--text-primary)]"
            >
              <Pencil className="h-4 w-4" />
            </button>
          </span>
        )}
        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          <Badge tone={tier === "premium" ? "cyan" : "neutral"}>{tier === "premium" ? "Pro" : "Free"}</Badge>
          <span className="inline-flex items-center gap-1 text-xs text-[color:var(--text-muted)]">
            <Send className="h-3.5 w-3.5 text-[color:var(--cyan)]" /> Połączono przez Telegram
          </span>
        </div>
      </div>
    </div>
  )
}
