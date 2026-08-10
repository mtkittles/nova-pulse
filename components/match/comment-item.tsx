"use client"

import { useState } from "react"
import { EyeOff, Flag, Heart, Loader2, MoreVertical, Trash2 } from "lucide-react"
import type { MatchComment } from "@/lib/extra-types"
import { formatRelativeTime } from "@/lib/time"
import { teamInitials } from "@/lib/design"
import { Badge } from "../ui/badge"

// Odcień awatara z nazwy — deterministyczny (ta sama osoba = ten sam kolor),
// ten sam wzorzec co components/team-badge.tsx (tam nieeksportowany).
function hue(name: string): number {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 360
  return h
}

function Avatar({ name }: { name: string }) {
  const h = hue(name || "?")
  return (
    <span
      className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-xs font-semibold text-white"
      style={{ background: `linear-gradient(135deg, hsla(${h},70%,45%,0.65), hsla(${(h + 40) % 360},70%,35%,0.65))` }}
      aria-hidden
    >
      {teamInitials(name)}
    </span>
  )
}

export function CommentItem({
  comment,
  liked,
  isAdmin,
  onLike,
  onReport,
  onDelete,
}: {
  comment: MatchComment
  liked: boolean
  isAdmin: boolean
  onLike: (id: string | number) => void
  onReport: (id: string | number, reason?: string) => Promise<{ ok: boolean; error?: string }>
  onDelete: (id: string | number) => Promise<{ ok: boolean; error?: string }>
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)
  const [reportReason, setReportReason] = useState("")
  const [reportState, setReportState] = useState<"idle" | "sending" | "done" | "error">("idle")
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleteState, setDeleteState] = useState<"idle" | "sending" | "error">("idle")

  const displayName = comment.username ? `@${comment.username}` : `Użytkownik ${String(comment.telegram_id).slice(-4)}`
  const canDelete = comment.is_mine || isAdmin

  async function submitReport() {
    setReportState("sending")
    const res = await onReport(comment.id, reportReason.trim() || undefined)
    if (res.ok) {
      setReportState("done")
      window.setTimeout(() => {
        setReportOpen(false)
        setMenuOpen(false)
        setReportState("idle")
        setReportReason("")
      }, 1200)
    } else {
      setReportState("error")
    }
  }

  async function submitDelete() {
    setDeleteState("sending")
    const res = await onDelete(comment.id)
    if (!res.ok) setDeleteState("error")
    // sukces: rodzic usuwa komentarz z listy, ten komponent po prostu znika
  }

  return (
    <li className="flex gap-3 py-4">
      <Avatar name={comment.username ?? String(comment.telegram_id)} />

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-semibold text-[color:var(--text-primary)]">{displayName}</span>
          <span className="shrink-0 text-xs text-[color:var(--text-muted)]">{formatRelativeTime(comment.created_at)}</span>
        </div>

        <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-[color:var(--text-secondary)]">{comment.body}</p>

        {/* Sygnał moderacji — z `pending_moderation` (nie `status`; backend
            celowo nie zwraca surowego statusu, żeby nie ułatwiać sondowania
            kolejki moderacji). Oracle i tak zwraca to pole WYŁĄCZNIE na
            własnych hidden_auto wołającego (z X-Comment-Token na GET), więc
            `is_mine` tu to tylko dodatkowa warstwa obrony, nie jedyny
            warunek. TYLKO przy tym konkretnym wpisie (nie globalny baner nad
            polem) — inaczej autor myśli że komentarz zniknął i wysyła go
            ponownie → trafia na filtr duplikatu (409). */}
        {comment.is_mine && comment.pending_moderation && (
          <Badge tone="warning" className="mt-1.5">
            <EyeOff className="h-3 w-3" aria-hidden />
            Widoczny tylko dla Ciebie — czeka na moderację
          </Badge>
        )}

        <div className="mt-2 flex items-center gap-1">
          <button
            type="button"
            onClick={() => onLike(comment.id)}
            aria-pressed={liked}
            aria-label={liked ? "Cofnij polubienie" : "Polub komentarz"}
            className={`tap flex min-h-[36px] items-center gap-1.5 rounded-full px-2.5 text-xs font-medium transition-colors ${
              liked ? "text-[color:var(--cyan)]" : "text-[color:var(--text-muted)] hover:text-[color:var(--text-secondary)]"
            }`}
          >
            <Heart className={`h-4 w-4 ${liked ? "fill-current" : ""}`} aria-hidden />
            <span className="tnum">{comment.likes_count}</span>
          </button>

          <div className="relative ml-auto">
            {canDelete ? (
              confirmDelete ? (
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-[color:var(--text-muted)]">Usunąć?</span>
                  <button
                    type="button"
                    onClick={submitDelete}
                    disabled={deleteState === "sending"}
                    className="tap min-h-[32px] rounded-full bg-[color:var(--danger)]/15 px-3 font-semibold text-[color:var(--danger)] disabled:opacity-60"
                  >
                    {deleteState === "sending" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Usuń"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setConfirmDelete(false)
                      setDeleteState("idle")
                    }}
                    className="tap min-h-[32px] rounded-full px-3 text-[color:var(--text-muted)] hover:text-[color:var(--text-secondary)]"
                  >
                    Anuluj
                  </button>
                  {deleteState === "error" && <span className="text-[color:var(--danger)]">Błąd</span>}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  aria-label="Usuń komentarz"
                  className="tap grid min-h-[36px] min-w-[36px] place-items-center rounded-full text-[color:var(--text-muted)] transition-colors hover:text-[color:var(--danger)]"
                >
                  <Trash2 className="h-4 w-4" aria-hidden />
                </button>
              )
            ) : (
              !comment.is_mine && (
                <>
                  <button
                    type="button"
                    onClick={() => setMenuOpen((v) => !v)}
                    aria-label="Więcej opcji"
                    aria-expanded={menuOpen}
                    className="tap grid min-h-[36px] min-w-[36px] place-items-center rounded-full text-[color:var(--text-muted)] transition-colors hover:text-[color:var(--text-secondary)]"
                  >
                    <MoreVertical className="h-4 w-4" aria-hidden />
                  </button>

                  {menuOpen && (
                    <>
                      <button
                        type="button"
                        aria-hidden
                        tabIndex={-1}
                        className="fixed inset-0 z-30 cursor-default"
                        onClick={() => {
                          setMenuOpen(false)
                          setReportOpen(false)
                        }}
                      />
                      <div className="absolute right-0 top-[calc(100%+4px)] z-40 w-64 rounded-xl border border-[color:var(--border-soft)] bg-[var(--bg-soft)] p-2 shadow-xl">
                        {!reportOpen ? (
                          <button
                            type="button"
                            onClick={() => setReportOpen(true)}
                            className="tap flex min-h-[40px] w-full items-center gap-2 rounded-lg px-2.5 text-left text-sm text-[color:var(--text-secondary)] hover:bg-[var(--surface-2)] hover:text-[color:var(--text-primary)]"
                          >
                            <Flag className="h-4 w-4" aria-hidden />
                            Zgłoś komentarz
                          </button>
                        ) : reportState === "done" ? (
                          <p className="px-2.5 py-2 text-sm text-[color:var(--success)]">Zgłoszono, dziękujemy.</p>
                        ) : (
                          <div className="p-1">
                            <textarea
                              value={reportReason}
                              onChange={(e) => setReportReason(e.target.value.slice(0, 300))}
                              placeholder="Powód (opcjonalnie)"
                              rows={2}
                              className="w-full resize-none rounded-lg border border-[color:var(--border-soft)] bg-[var(--surface-2)] p-2 text-xs text-[color:var(--text-primary)] outline-none focus:border-[color:var(--cyan)]/50"
                            />
                            {reportState === "error" && <p className="mt-1 text-xs text-[color:var(--danger)]">Nie udało się zgłosić.</p>}
                            <div className="mt-2 flex justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => setReportOpen(false)}
                                className="tap min-h-[32px] rounded-full px-3 text-xs text-[color:var(--text-muted)] hover:text-[color:var(--text-secondary)]"
                              >
                                Anuluj
                              </button>
                              <button
                                type="button"
                                onClick={submitReport}
                                disabled={reportState === "sending"}
                                className="tap flex min-h-[32px] items-center gap-1.5 rounded-full bg-[var(--cyan-soft)] px-3 text-xs font-semibold text-[color:var(--cyan)] disabled:opacity-60"
                              >
                                {reportState === "sending" && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                                Zgłoś
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </>
              )
            )}
          </div>
        </div>
      </div>
    </li>
  )
}
