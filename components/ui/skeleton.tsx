// Skeleton — animowany puls surface-2 (zamiast spinnerów).
export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-[var(--surface-2)] ${className}`} />
}
