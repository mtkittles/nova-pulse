// === BRANCH audit/lighthouse-public — NIE MERGOWAĆ DO main ===
// Tymczasowy tryb publicznego podglądu do audytu Lighthouse.
// Gdy true: każdy odwiedzający jest traktowany jak zalogowany premium
// (gating free/premium wyłączony), bez dotykania logiki auth/JWT.
// Na main ta flaga nie istnieje — override działa wyłącznie na tym branchu.
export const AUDIT_PUBLIC = true
