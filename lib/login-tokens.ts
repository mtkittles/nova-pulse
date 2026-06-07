import "server-only"
import { Redis } from "@upstash/redis"

// Magazyn tokenów deep-link logowania — Upstash Redis (współdzielony między
// instancjami Vercela, w przeciwieństwie do in-process Map). TTL 5 min.
// Wymaga env: UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN.

let _redis: Redis | null = null
function redis(): Redis {
  if (_redis) return _redis
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) {
    throw new Error("Brak UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN")
  }
  _redis = new Redis({ url, token })
  return _redis
}

const TTL_SECONDS = 5 * 60
const key = (token: string) => `login:${token}`

type Stored =
  | { status: "pending" }
  | {
      status: "confirmed"
      telegram_id: number
      first_name: string
      last_name?: string
      username?: string
    }

export type CheckResult =
  | { status: "pending" }
  | { status: "confirmed"; telegram_id: number; first_name: string; last_name?: string; username?: string }
  | { status: "expired" }
  | { status: "notfound" }

export async function createPendingToken(token: string): Promise<void> {
  await redis().set(key(token), { status: "pending" } satisfies Stored, { ex: TTL_SECONDS })
}

export async function confirmToken(
  token: string,
  data: { telegram_id: number; first_name: string; last_name?: string; username?: string },
): Promise<boolean> {
  const cur = await redis().get(key(token))
  if (!cur) return false // wygasł lub nie istnieje
  await redis().set(key(token), { status: "confirmed", ...data } satisfies Stored, { ex: TTL_SECONDS })
  return true
}

export async function checkToken(token: string): Promise<CheckResult> {
  const v = (await redis().get(key(token))) as Stored | null
  if (!v) return { status: "notfound" } // Redis TTL = wygasłe znika
  if (v.status === "pending") return { status: "pending" }
  return {
    status: "confirmed",
    telegram_id: v.telegram_id,
    first_name: v.first_name,
    last_name: v.last_name,
    username: v.username,
  }
}

export async function consumeToken(token: string): Promise<void> {
  await redis().del(key(token))
}
