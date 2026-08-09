import "server-only"
import { mintCommentToken } from "./comment-token"
import type { Session } from "./auth"

// Warstwa dostępu do komentarzy pod meczami — public_api na Hetznerze
// (ten sam serwis co reszta danych bota, ORACLE_API_URL/ORACLE_API_KEY).
// GET (lista) jest publiczne — tylko X-API-Key. Akcje (POST/DELETE) dodają
// X-Comment-Token mintowany z sesji (patrz comment-token.ts).

export function isCommentsConfigured(): boolean {
  return Boolean(process.env.ORACLE_API_URL && process.env.ORACLE_API_KEY && process.env.COMMENT_TOKEN_SECRET)
}

export interface CommentApiResult<T> {
  ok: boolean
  status: number
  data: T | null
  error: string | null
}

function oracleBase(): string {
  return (process.env.ORACLE_API_URL ?? "").replace(/\/$/, "")
}

async function rawFetch(path: string, method: string, body: unknown, token: string | null): Promise<Response> {
  const headers: Record<string, string> = { "X-API-Key": process.env.ORACLE_API_KEY ?? "" }
  if (token) headers["X-Comment-Token"] = token
  if (body !== undefined) headers["content-type"] = "application/json"
  return fetch(`${oracleBase()}/public-api${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    cache: "no-store",
  })
}

async function parseBody<T>(res: Response): Promise<T | null> {
  const text = await res.text()
  if (!text) return null
  try {
    return JSON.parse(text) as T
  } catch {
    return null
  }
}

function errorMessage(data: unknown): string | null {
  if (data && typeof data === "object") {
    const d = data as Record<string, unknown>
    if (typeof d.error === "string") return d.error
    if (typeof d.message === "string") return d.message
  }
  return null
}

// GET — bez tokenu komentarza, tylko X-API-Key.
async function publicGet<T>(path: string): Promise<CommentApiResult<T>> {
  const res = await rawFetch(path, "GET", undefined, null)
  const data = await parseBody<T>(res)
  return { ok: res.ok, status: res.status, data, error: res.ok ? null : (errorMessage(data) ?? "Błąd serwera.") }
}

// Akcja (POST/DELETE) — wymaga X-Comment-Token, mintowanego z sesji tuż
// przed wywołaniem (zawsze świeży, nigdy nie cache'owany między requestami
// — cena mintowania to jeden HMAC, więc prościej mintować za każdym razem
// niż zarządzać cache'em tokenu).
//
// Backend zwraca trzy różne 401 (pole `error` w JSON):
//  - missing_comment_token / comment_token_expired → domintuj świeży token,
//    powtórz DOKŁADNIE RAZ (nie w pętli).
//  - invalid_comment_token → błąd integracji albo manipulacja po stronie
//    klienta; NIE ponawiaj, propaguj błąd wprost.
async function authedAction<T>(
  path: string,
  method: "POST" | "DELETE",
  session: Session,
  body?: unknown,
): Promise<CommentApiResult<T>> {
  let token = mintCommentToken(session)
  let res = await rawFetch(path, method, body, token)

  if (res.status === 401) {
    const peek = await res
      .clone()
      .json()
      .catch(() => null as { error?: string } | null)
    const code = peek?.error
    if (code === "missing_comment_token" || code === "comment_token_expired") {
      token = mintCommentToken(session)
      res = await rawFetch(path, method, body, token)
    }
  }

  const data = await parseBody<T>(res)
  return { ok: res.ok, status: res.status, data, error: res.ok ? null : (errorMessage(data) ?? "Błąd serwera.") }
}

export function listComments(eventId: string, params: { sort?: "newest" | "top"; limit?: number; offset?: number }) {
  const qs = new URLSearchParams()
  if (params.sort) qs.set("sort", params.sort)
  if (params.limit != null) qs.set("limit", String(params.limit))
  if (params.offset != null) qs.set("offset", String(params.offset))
  const q = qs.toString()
  return publicGet<unknown>(`/match/${encodeURIComponent(eventId)}/comments${q ? `?${q}` : ""}`)
}

export function createComment(eventId: string, session: Session, body: string) {
  return authedAction<unknown>(`/match/${encodeURIComponent(eventId)}/comments`, "POST", session, { body })
}

export function likeComment(commentId: string, session: Session) {
  return authedAction<unknown>(`/comments/${encodeURIComponent(commentId)}/like`, "POST", session)
}

export function reportComment(commentId: string, session: Session, reason?: string) {
  return authedAction<unknown>(`/comments/${encodeURIComponent(commentId)}/report`, "POST", session, reason ? { reason } : {})
}

export function deleteComment(commentId: string, session: Session) {
  return authedAction<unknown>(`/comments/${encodeURIComponent(commentId)}`, "DELETE", session)
}
