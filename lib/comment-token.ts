import "server-only"
import crypto from "node:crypto"
import type { Session } from "./auth"

// Token krótkotrwałego dostępu do akcji na komentarzach (POST/DELETE) —
// mintowany WYŁĄCZNIE server-side z aktywnej sesji (lb_session), nigdy na
// podstawie danych od klienta. COMMENT_TOKEN_SECRET nigdy nie opuszcza
// serwera — tylko podpisany token trafia (per-request, w nagłówku
// X-Comment-Token) do public_api na Hetznerze.
const TTL_SECONDS = 30 * 60

function base64url(buf: Buffer): string {
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

// Format: <payload_b64>.<sig_b64> — payload z kluczami POSORTOWANYMI
// ALFABETYCZNIE (JSON.stringify z tablicą-replacerem wymusza kolejność
// kluczy; inna kolejność = inny ciąg bajtów = inny podpis, więc backend by
// go odrzucił). sig = HMAC-SHA256(sekret, payload_b64 jako ASCII).
export function mintCommentToken(session: Session): string {
  const secret = process.env.COMMENT_TOKEN_SECRET
  if (!secret) throw new Error("Brak COMMENT_TOKEN_SECRET")

  const now = Math.floor(Date.now() / 1000)
  const payload: Record<string, string | number> = {
    exp: now + TTL_SECONDS,
    iat: now,
    telegram_id: session.uid,
  }
  if (session.username) payload.username = session.username

  const payloadJson = JSON.stringify(payload, Object.keys(payload).sort())
  const payloadB64 = base64url(Buffer.from(payloadJson, "utf8"))
  const sig = crypto.createHmac("sha256", secret).update(payloadB64).digest()
  return `${payloadB64}.${base64url(sig)}`
}
