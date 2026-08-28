// Jednolite formatowanie godziny meczu — ZAWSZE w strefie urządzenia użytkownika.
// Oracle zwraca kickoff_utc jako "2026-06-13 19:00:00" (UTC bez strefy) LUB null,
// gdy mecz nie ma jeszcze fixture. Przy null/niepoprawnej dacie NIGDY nie pokazujemy
// 00:00 — zwracamy czytelny komunikat.

export function formatKickoff(
  utcStr: string | null | undefined,
  opts?: { dateOnly?: boolean },
): string {
  if (!utcStr) return "Godzina wkrótce"
  // "2026-06-13 19:00:00" → "2026-06-13T19:00:00Z" (spacja→T, dopnij Z gdy brak strefy)
  const hasZone = /[zZ]|[+-]\d{2}:?\d{2}$/.test(utcStr)
  const iso = utcStr.replace(" ", "T") + (hasZone ? "" : "Z")
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return "Godzina wkrótce"
  return new Intl.DateTimeFormat("pl-PL", {
    weekday: "short",
    day: "numeric",
    month: "long",
    ...(opts?.dateOnly ? {} : { hour: "2-digit", minute: "2-digit" }),
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  }).format(d)
}

// Czas względny ("3 min temu") — komentarze. Ta sama tolerancja formatu co
// formatKickoff (spacja zamiast "T", brak strefy → zakładamy UTC), bo
// created_at z Oracle prawdopodobnie ma ten sam kształt. Powyżej tygodnia
// przechodzi na krótką datę absolutną (dłuższe "X dni temu" jest mniej
// czytelne niż konkretna data).
export function formatRelativeTime(utcStr: string | null | undefined): string {
  if (!utcStr) return ""
  const hasZone = /[zZ]|[+-]\d{2}:?\d{2}$/.test(utcStr)
  const iso = utcStr.replace(" ", "T") + (hasZone ? "" : "Z")
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ""

  const diffSec = Math.round((Date.now() - d.getTime()) / 1000)
  if (diffSec < 45) return "przed chwilą"
  if (diffSec < 90) return "1 min temu"
  if (diffSec < 60 * 60) return `${Math.round(diffSec / 60)} min temu`
  if (diffSec < 90 * 60) return "1 godz. temu"
  if (diffSec < 60 * 60 * 24) return `${Math.round(diffSec / 3600)} godz. temu`
  if (diffSec < 60 * 60 * 24 * 2) return "wczoraj"
  if (diffSec < 60 * 60 * 24 * 7) return `${Math.round(diffSec / 86400)} dni temu`
  return new Intl.DateTimeFormat("pl-PL", {
    day: "numeric",
    month: "short",
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  }).format(d)
}
