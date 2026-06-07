// In-process token store for deep-link Telegram login.
// Works reliably on single Vercel instance (personal-scale traffic, 5-min TTL).
// To support multi-instance: replace getStore() with Vercel KV (@vercel/kv).

type PendingEntry = { status: "pending"; expires: number }
type ConfirmedEntry = {
  status: "confirmed"
  expires: number
  telegram_id: number
  first_name: string
  last_name?: string
  username?: string
}
export type TokenEntry = PendingEntry | ConfirmedEntry

export type CheckResult =
  | { status: "pending" }
  | { status: "confirmed"; telegram_id: number; first_name: string; last_name?: string; username?: string }
  | { status: "expired" }
  | { status: "notfound" }

declare global {
  // eslint-disable-next-line no-var
  var __loginTokenStore: Map<string, TokenEntry> | undefined
}

function getStore(): Map<string, TokenEntry> {
  if (!global.__loginTokenStore) global.__loginTokenStore = new Map()
  return global.__loginTokenStore
}

export function createPendingToken(token: string): void {
  getStore().set(token, { status: "pending", expires: Date.now() + 5 * 60_000 })
}

export function confirmToken(
  token: string,
  data: { telegram_id: number; first_name: string; last_name?: string; username?: string },
): boolean {
  const store = getStore()
  const entry = store.get(token)
  if (!entry || entry.expires < Date.now()) return false
  store.set(token, { ...data, status: "confirmed", expires: entry.expires })
  return true
}

export function checkToken(token: string): CheckResult {
  const store = getStore()
  const entry = store.get(token)
  if (!entry) return { status: "notfound" }
  if (entry.expires < Date.now()) {
    store.delete(token)
    return { status: "expired" }
  }
  if (entry.status === "pending") return { status: "pending" }
  const { telegram_id, first_name, last_name, username } = entry
  return { status: "confirmed", telegram_id, first_name, last_name, username }
}

export function consumeToken(token: string): void {
  getStore().delete(token)
}
