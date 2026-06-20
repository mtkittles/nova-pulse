"use client"

import { useEffect, useState } from "react"
import { DEFAULT_AVATAR, PROFILE_AVATARS, PROFILE_EVENT, readProfile, writeProfile } from "@/lib/profile-local"
import { LogoutButton } from "@/components/logout-button"

// [F] Ustawienia — wybór avatara (localStorage, TODO Oracle) + wylogowanie.
export function ProfileSettings() {
  const [avatar, setAvatar] = useState(DEFAULT_AVATAR)

  useEffect(() => {
    const sync = () => setAvatar(readProfile().avatar)
    sync()
    window.addEventListener(PROFILE_EVENT, sync)
    window.addEventListener("storage", sync)
    return () => {
      window.removeEventListener(PROFILE_EVENT, sync)
      window.removeEventListener("storage", sync)
    }
  }, [])

  return (
    <div className="space-y-4">
      <div>
        <p className="mb-2 text-sm text-[color:var(--text-secondary)]">Avatar</p>
        <div className="flex flex-wrap gap-2">
          {PROFILE_AVATARS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => writeProfile({ avatar: emoji })}
              aria-label={`Ustaw avatar ${emoji}`}
              aria-pressed={avatar === emoji}
              className={`grid h-11 w-11 place-items-center rounded-xl border text-xl transition ${
                avatar === emoji
                  ? "border-[color:var(--cyan)] bg-[var(--cyan-soft)]"
                  : "border-[color:var(--border-soft)] bg-[var(--surface-2)] hover:bg-[var(--surface-3)]"
              }`}
            >
              {emoji}
            </button>
          ))}
        </div>
        <p className="mt-2 text-[11px] text-[color:var(--text-muted)]">Zapis lokalny (na tym urządzeniu).</p>
      </div>
      <div className="border-t border-[color:var(--border-soft)] pt-4">
        <LogoutButton />
      </div>
    </div>
  )
}
