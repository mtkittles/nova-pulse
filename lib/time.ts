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
