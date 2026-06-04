import "server-only"
import { cookies } from "next/headers"
import { SignJWT, jwtVerify } from "jose"

export const SESSION_COOKIE = "lb_session"
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7 // 7 dni

export type Session = {
  uid: string
  username?: string
  name?: string
}

function key(): Uint8Array {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error("Brak JWT_SECRET")
  return new TextEncoder().encode(secret)
}

// Podpisuje sesję JWT (HS256). Używane przez /api/auth/telegram.
export async function signSession(payload: Session): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(key())
}

// Czyta i weryfikuje sesję z cookie. Zwraca null, gdy brak/niepoprawna.
// Wyłącznie server-side (Server Component / Route Handler).
export async function getSession(): Promise<Session | null> {
  try {
    const store = await cookies()
    const token = store.get(SESSION_COOKIE)?.value
    if (!token) return null
    const { payload } = await jwtVerify(token, key())
    return {
      uid: String(payload.uid),
      username: typeof payload.username === "string" ? payload.username : undefined,
      name: typeof payload.name === "string" ? payload.name : undefined,
    }
  } catch {
    return null
  }
}
