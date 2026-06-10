// Polska odmiana liczebników (mecz / typ).
export function plMatches(n: number): string {
  if (n === 1) return "mecz"
  const last = n % 10
  const teen = n % 100
  return last >= 2 && last <= 4 && !(teen >= 12 && teen <= 14) ? "mecze" : "meczów"
}

export function plTips(n: number): string {
  if (n === 1) return "typ"
  const last = n % 10
  const teen = n % 100
  return last >= 2 && last <= 4 && !(teen >= 12 && teen <= 14) ? "typy" : "typów"
}
