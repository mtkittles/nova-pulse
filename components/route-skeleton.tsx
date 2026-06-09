export function RouteSkeleton() {
  return (
    <main className="min-h-screen bg-[var(--bg)] px-6 py-10 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="h-9 w-56 animate-pulse rounded-2xl bg-white/[0.06]" />
        <div className="mt-3 h-5 w-80 max-w-full animate-pulse rounded-xl bg-white/[0.04]" />
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-48 animate-pulse rounded-[1.8rem] border border-white/12 bg-white/[0.04]" />
          ))}
        </div>
      </div>
    </main>
  )
}
