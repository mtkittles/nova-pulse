// Lokalny profil (avatar + nick) — TYMCZASOWO w localStorage.
// TODO: persystencja w Oracle per telegram_id (gdy endpoint /user/{id}/profile powstanie).
export const PROFILE_AVATARS = ["🐺", "🦊", "🎯", "⚽", "🔥", "💎", "🏆"]
export const DEFAULT_AVATAR = "🐺"
export const PROFILE_EVENT = "lb-profile"
const KEY = "lb_profile"

export interface LocalProfile {
  avatar: string
  nick: string | null
}

export function readProfile(): LocalProfile {
  if (typeof window === "undefined") return { avatar: DEFAULT_AVATAR, nick: null }
  try {
    const r = JSON.parse(localStorage.getItem(KEY) || "{}")
    return { avatar: typeof r.avatar === "string" ? r.avatar : DEFAULT_AVATAR, nick: typeof r.nick === "string" ? r.nick : null }
  } catch {
    return { avatar: DEFAULT_AVATAR, nick: null }
  }
}

export function writeProfile(patch: Partial<LocalProfile>) {
  if (typeof window === "undefined") return
  const next = { ...readProfile(), ...patch }
  localStorage.setItem(KEY, JSON.stringify(next))
  window.dispatchEvent(new Event(PROFILE_EVENT))
}
