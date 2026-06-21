import "server-only"
import { cookies } from "next/headers"
import { SignJWT, jwtVerify } from "jose"
import { DEMO_MODE, DEMO_UNLOCK_PREMIUM, DEMO_UNLOCK_ADMIN, DEMO_USER } from "./demo-mode"

export const SESSION_COOKIE = "lb_session"
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7 // 7 dni

export type Tier = "free" | "premium"

export interface Session {
  uid: string
  username?: string
  name?: string
  tier: Tier
  isAdmin: boolean
}

function key(): Uint8Array {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error("Brak JWT_SECRET")
  return new TextEncoder().encode(secret)
}

// Tier liczony z env (bez bazy): admin = ADMIN_TELEGRAM_ID,
// premium = admin lub na liście PREMIUM_TELEGRAM_IDS (CSV). Zawsze świeży.
export function resolveTier(uid: string): { tier: Tier; isAdmin: boolean } {
  const id = String(uid)
  const admin = process.env.ADMIN_TELEGRAM_ID
  const isAdmin = Boolean(admin && String(admin) === id)
  const premiumIds = (process.env.PREMIUM_TELEGRAM_IDS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
  const premium = isAdmin || premiumIds.includes(id)
  return { tier: premium ? "premium" : "free", isAdmin }
}

// JWT przechowuje tylko tożsamość — tier/isAdmin liczone per request.
export async function signSession(p: { uid: string; username?: string; name?: string }): Promise<string> {
  return await new SignJWT({ uid: p.uid, username: p.username, name: p.name })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(key())
}

// Realna sesja z cookie + JWT (bez zmian względem produkcji).
async function readRealSession(): Promise<Session | null> {
  try {
    const store = await cookies()
    const token = store.get(SESSION_COOKIE)?.value
    if (!token) return null
    const { payload } = await jwtVerify(token, key())
    const uid = String(payload.uid)
    const { tier, isAdmin } = resolveTier(uid)
    return {
      uid,
      username: typeof payload.username === "string" ? payload.username : undefined,
      name: typeof payload.name === "string" ? payload.name : undefined,
      tier,
      isAdmin,
    }
  } catch {
    return null
  }
}

// Sesja demo: gdy brak realnej sesji i DEMO_MODE → syntetyczny tester.
// P0-2: premium i admin to ROZDZIELNE flagi. Premium odblokowane domyślnie,
// admin TYLKO gdy jawnie włączony serwerowo (DEMO_UNLOCK_ADMIN=true).
const DEMO_SESSION: Session = {
  uid: DEMO_USER.id,
  username: DEMO_USER.username,
  name: DEMO_USER.first_name,
  tier: DEMO_UNLOCK_PREMIUM ? "premium" : "free",
  isAdmin: DEMO_UNLOCK_ADMIN,
}

export async function getSession(): Promise<Session | null> {
  const real = await readRealSession()
  if (real) return real
  if (DEMO_MODE) return DEMO_SESSION
  return null
}
