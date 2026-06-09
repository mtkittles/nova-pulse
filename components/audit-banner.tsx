import { TriangleAlert } from "lucide-react"

// Widoczny tylko na branchu audit/lighthouse-public — odróżnia podgląd od prod.
export function AuditBanner() {
  return (
    <div className="relative z-[60] flex items-center justify-center gap-2 bg-amber-500 px-4 py-2 text-center text-[13px] font-semibold text-black">
      <TriangleAlert className="h-4 w-4 shrink-0" aria-hidden />
      PREVIEW AUDYTU — wszystkie funkcje odblokowane bez logowania
    </div>
  )
}
