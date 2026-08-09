"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { LogIn, MessageCircle, Send } from "lucide-react"
import type { MatchComment } from "@/lib/extra-types"
import { EmptyState } from "../ui/empty-state"
import { RangePills, type RangeOption } from "../ui/range-pills"
import { CommentItem } from "./comment-item"

const LIMIT = 20
const MAX_LEN = 500
const LIKED_STORAGE_KEY = "lb_liked_comments"

type Sort = "newest" | "top"
const SORT_OPTIONS: readonly RangeOption<Sort>[] = [
  { key: "newest", label: "Najnowsze" },
  { key: "top", label: "Najlepsze" },
]

function loadLiked(): Set<string> {
  if (typeof window === "undefined") return new Set()
  try {
    const raw = window.localStorage.getItem(LIKED_STORAGE_KEY)
    return raw ? new Set(JSON.parse(raw)) : new Set()
  } catch {
    return new Set()
  }
}

function saveLiked(set: Set<string>) {
  try {
    window.localStorage.setItem(LIKED_STORAGE_KEY, JSON.stringify([...set]))
  } catch {
    // localStorage niedostępny (tryb prywatny itp.) — po prostu nie pamiętamy między sesjami
  }
}

// Backend zwraca ogólny błąd na 429/403/409/422 — tłumaczymy kod HTTP na
// czytelny komunikat PL, bez zdradzania szczegółów (np. dlaczego akurat
// hidden_auto, jeśli tak wygląda odpowiedź).
async function friendlyError(res: Response, fallback: string): Promise<string> {
  if (res.status === 429) return "Zbyt wiele komentarzy. Spróbuj za chwilę."
  if (res.status === 409) return "Już to napisałeś przed chwilą."
  if (res.status === 422) return "Komentarz jest pusty lub za długi."
  if (res.status === 403) {
    const data = await res.json().catch(() => null)
    return (data?.message as string) || (data?.error as string) || "Ta akcja jest zablokowana."
  }
  if (res.status === 401) {
    const data = await res.json().catch(() => null)
    return (data?.message as string) || "Zaloguj się, żeby kontynuować."
  }
  const data = await res.json().catch(() => null)
  return (data?.error as string) || (data?.message as string) || fallback
}

export function CommentsPanel({
  eventId,
  loggedIn,
  isAdmin,
  onCountChange,
}: {
  eventId: string
  loggedIn: boolean
  isAdmin: boolean
  onCountChange?: (n: number) => void
}) {
  const [sort, setSort] = useState<Sort>("newest")
  const [comments, setComments] = useState<MatchComment[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [listError, setListError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [liked, setLiked] = useState<Set<string>>(() => new Set())

  const [text, setText] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [composerError, setComposerError] = useState<string | null>(null)

  const requestId = useRef(0)

  useEffect(() => {
    setLiked(loadLiked())
  }, [])

  async function load(offset: number, replace: boolean) {
    const myRequest = ++requestId.current
    if (replace) {
      setLoading(true)
      setListError(null)
    } else {
      setLoadingMore(true)
    }
    try {
      const res = await fetch(`/api/match/${encodeURIComponent(eventId)}/comments?sort=${sort}&limit=${LIMIT}&offset=${offset}`)
      const data = await res.json().catch(() => null)
      if (myRequest !== requestId.current) return // odpowiedź już nieaktualna (zmienił się sort w międzyczasie)
      if (!res.ok) {
        setListError((data?.error as string) || "Nie udało się wczytać komentarzy.")
        return
      }
      const list: MatchComment[] = Array.isArray(data?.comments) ? data.comments : []
      const t = typeof data?.total === "number" ? data.total : replace ? list.length : total + list.length
      setComments((prev) => (replace ? list : [...prev, ...list]))
      setTotal(t)
      setHasMore(list.length === LIMIT)
      onCountChange?.(t)
    } catch {
      if (myRequest === requestId.current) setListError("Nie udało się wczytać komentarzy.")
    } finally {
      if (myRequest === requestId.current) {
        setLoading(false)
        setLoadingMore(false)
      }
    }
  }

  useEffect(() => {
    load(0, true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId, sort])

  async function onSubmit() {
    const body = text.trim()
    if (!body || body.length > MAX_LEN || submitting) return
    setSubmitting(true)
    setComposerError(null)
    try {
      const res = await fetch(`/api/match/${encodeURIComponent(eventId)}/comments`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ body }),
      })
      if (!res.ok) {
        setComposerError(await friendlyError(res, "Nie udało się dodać komentarza."))
        return
      }
      const raw = await res.json().catch(() => null)
      // Odpowiedź bywa zawinięta ({ comment: {...} }) zamiast płaskiej — bierzemy
      // to, co faktycznie wygląda jak komentarz (ma `id`).
      const wrapped = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : null
      const created = (
        wrapped && wrapped.comment && typeof wrapped.comment === "object" ? wrapped.comment : wrapped
      ) as (MatchComment & { status?: string }) | null
      setText("")
      if (created && created.id != null) {
        // TYLKO "hidden_auto" liczy się jako moderacja — każda inna wartość
        // (w tym pole `status` będące częścią koperty odpowiedzi, np.
        // "success"/"ok", a nie statusem komentarza) traktujemy jak widoczny.
        // Fałszywie pozytywne "czeka na weryfikację" na KAŻDYM poście było
        // dokładnie tym błędem — zbyt szerokie "status !== visible".
        setComments((prev) => [{ ...created, is_mine: true }, ...prev])
        if (created.status !== "hidden_auto") {
          setTotal((t) => {
            const nt = t + 1
            onCountChange?.(nt)
            return nt
          })
        }
      } else {
        // nieznany kształt odpowiedzi — bezpieczniej odświeżyć listę niż zgadywać
        load(0, true)
      }
    } catch {
      setComposerError("Nie udało się dodać komentarza.")
    } finally {
      setSubmitting(false)
    }
  }

  function toggleLike(id: string | number) {
    const key = String(id)
    const isLiked = liked.has(key)
    const next = new Set(liked)
    if (isLiked) next.delete(key)
    else next.add(key)
    setLiked(next)
    saveLiked(next)
    setComments((prev) => prev.map((c) => (String(c.id) === key ? { ...c, likes_count: Math.max(0, c.likes_count + (isLiked ? -1 : 1)) } : c)))

    fetch(`/api/comments/${encodeURIComponent(key)}/like`, { method: "POST" }).then((res) => {
      if (res.ok) return
      // rewert przy błędzie
      const reverted = new Set(liked)
      setLiked(reverted)
      saveLiked(reverted)
      setComments((prev) => prev.map((c) => (String(c.id) === key ? { ...c, likes_count: Math.max(0, c.likes_count + (isLiked ? 1 : -1)) } : c)))
    })
  }

  async function report(id: string | number, reason?: string): Promise<{ ok: boolean; error?: string }> {
    try {
      const res = await fetch(`/api/comments/${encodeURIComponent(String(id))}/report`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ reason }),
      })
      if (!res.ok) return { ok: false, error: await friendlyError(res, "Nie udało się zgłosić.") }
      return { ok: true }
    } catch {
      return { ok: false, error: "Nie udało się zgłosić." }
    }
  }

  async function remove(id: string | number): Promise<{ ok: boolean; error?: string }> {
    try {
      const res = await fetch(`/api/comments/${encodeURIComponent(String(id))}`, { method: "DELETE" })
      if (!res.ok) return { ok: false, error: await friendlyError(res, "Nie udało się usunąć.") }
      setComments((prev) => prev.filter((c) => String(c.id) !== String(id)))
      setTotal((t) => {
        const nt = Math.max(0, t - 1)
        onCountChange?.(nt)
        return nt
      })
      return { ok: true }
    } catch {
      return { ok: false, error: "Nie udało się usunąć." }
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[color:var(--text-secondary)]">
          Komentarze{total > 0 ? ` (${total})` : ""}
        </h2>
        {comments.length > 0 && <RangePills value={sort} options={SORT_OPTIONS} onChange={setSort} />}
      </div>

      {/* KOMPOZYTOR — pole dodawania albo CTA logowania */}
      {loggedIn ? (
        <div className="rounded-[var(--radius-card)] border border-[color:var(--border-subtle)] bg-[var(--bg-1)] p-4 backdrop-blur">
          <textarea
            value={text}
            onChange={(e) => {
              setText(e.target.value.slice(0, MAX_LEN))
              if (composerError) setComposerError(null)
            }}
            placeholder="Napisz komentarz o tym meczu…"
            rows={3}
            maxLength={MAX_LEN}
            className="w-full resize-none rounded-xl border border-[color:var(--border-soft)] bg-[var(--surface-2)] p-3 text-sm text-[color:var(--text-primary)] outline-none placeholder:text-[color:var(--text-muted)] focus:border-[color:var(--cyan)]/50"
          />
          <div className="mt-2 flex items-center justify-between gap-3">
            <span className={`tnum text-xs ${text.length > MAX_LEN - 20 ? "text-[color:var(--warning)]" : "text-[color:var(--text-muted)]"}`}>
              {text.length}/{MAX_LEN}
            </span>
            <button
              type="button"
              onClick={onSubmit}
              disabled={!text.trim() || submitting}
              className="tap inline-flex min-h-[44px] items-center gap-2 rounded-full bg-[var(--cyan)] px-5 text-sm font-semibold text-[color:var(--on-accent)] transition disabled:opacity-40"
            >
              <Send className="h-4 w-4" aria-hidden />
              {submitting ? "Wysyłanie…" : "Wyślij"}
            </button>
          </div>
          {composerError && <p className="mt-2 text-sm text-[color:var(--danger)]">{composerError}</p>}
        </div>
      ) : (
        <div className="flex flex-col items-stretch gap-3 rounded-[var(--radius-card)] border border-[color:var(--border-subtle)] bg-[var(--bg-1)] p-4 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-[color:var(--text-secondary)]">Zaloguj się, żeby dołączyć do dyskusji.</p>
          <Link
            href="/login"
            className="tap inline-flex min-h-[44px] shrink-0 items-center justify-center gap-2 rounded-full bg-[var(--cyan)] px-4 text-sm font-semibold text-[color:var(--on-accent)]"
          >
            <LogIn className="h-4 w-4" aria-hidden />
            Zaloguj przez Telegram
          </Link>
        </div>
      )}

      {/* LISTA */}
      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="shimmer h-20 rounded-xl border border-[color:var(--border-soft)]" />
          ))}
        </div>
      ) : listError ? (
        <p className="rounded-xl border border-[color:var(--danger)]/30 bg-[color:var(--danger)]/10 p-4 text-center text-sm text-[color:var(--danger)]">
          {listError}
        </p>
      ) : comments.length === 0 ? (
        <EmptyState icon={MessageCircle} title="Brak komentarzy" description="Bądź pierwszy." />
      ) : (
        <>
          <ul className="divide-y divide-[color:var(--border-soft)] rounded-[var(--radius-card)] border border-[color:var(--border-subtle)] bg-[var(--bg-1)] px-4 backdrop-blur">
            {comments.map((c) => (
              <CommentItem
                key={c.id}
                comment={c}
                liked={liked.has(String(c.id))}
                isAdmin={isAdmin}
                onLike={toggleLike}
                onReport={report}
                onDelete={remove}
              />
            ))}
          </ul>
          {hasMore && (
            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => load(comments.length, false)}
                disabled={loadingMore}
                className="tap min-h-[44px] rounded-full border border-[color:var(--border-soft)] px-5 text-sm font-medium text-[color:var(--text-secondary)] transition hover:bg-[var(--surface-2)] hover:text-[color:var(--text-primary)] disabled:opacity-50"
              >
                {loadingMore ? "Wczytywanie…" : "Pokaż więcej"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
