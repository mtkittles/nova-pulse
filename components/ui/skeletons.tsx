// Skeleton loadery — kształtem odwzorowują docelowy układ (nie napis „Loading").

export function TipCardSkeleton() {
  return (
    <div className="animate-pulse rounded-[1.8rem] border border-white/12 bg-white/[0.04] p-6">
      <div className="flex items-center justify-between">
        <div className="h-3 w-24 rounded bg-white/10" />
        <div className="h-3 w-16 rounded bg-white/10" />
      </div>
      <div className="mt-5 flex items-center gap-3">
        <div className="h-9 w-9 rounded-full bg-white/10" />
        <div className="h-4 w-40 rounded bg-white/10" />
      </div>
      <div className="mt-5 grid grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-14 rounded-2xl bg-white/[0.06]" />
        ))}
      </div>
      <div className="mt-4 h-2 w-full rounded-full bg-white/10" />
    </div>
  )
}

export function TipGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <TipCardSkeleton key={i} />
      ))}
    </div>
  )
}

export function RowsSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div className="space-y-2 p-4">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-9 animate-pulse rounded-lg bg-white/[0.05]" />
      ))}
    </div>
  )
}
