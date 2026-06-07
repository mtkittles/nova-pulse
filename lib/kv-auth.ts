import "server-only"
import { Redis } from "@upstash/redis"

// Tymczasowy magazyn tokenów logowania (deep-link).
// Wymagane env: UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN.

let _redis: Redis | null = null
export function kv(): Redis {
  if (_redis) return _redis
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) throw new Error("Brak UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN")
  _redis = new Redis({ url, token })
  return _redis
}

export function isKvConfigured(): boolean {
  return Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)
}

export type AuthPayload = { uid: string; username?: string; name?: string }

const TTL_SECONDS = 300 // token ważny 5 minut
const key = (token: string) => `auth:${token}`

export async function reservePendingToken(token: string): Promise<void> {
  await kv().set(key(token), { status: "pending" }, { ex: TTL_SECONDS })
}

export async function completeToken(token: string, payload: AuthPayload): Promise<boolean> {
  // Tylko jeśli istnieje (jeszcze nieskonsumowany / niewygasły).
  const cur = await kv().get(key(token))
  if (!cur) return false
  await kv().set(key(token), { status: "done", payload }, { ex: TTL_SECONDS })
  return true
}

export async function consumeToken(token: string): Promise<AuthPayload | null> {
  const v = (await kv().get(key(token))) as { status: string; payload?: AuthPayload } | null
  if (!v || v.status !== "done" || !v.payload) return null
  await kv().del(key(token)) // jednorazowy
  return v.payload
}
