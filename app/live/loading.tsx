import { AppShell } from "@/components/app-shell"
import { Skeleton } from "@/components/ui/skeleton"

// Szkielet ekranu /live (każda sekcja własny placeholder).
export default function Loading() {
  return (
    <AppShell loggedIn={false}>
      <div className="mx-auto max-w-2xl space-y-8">
        <Skeleton className="h-9 w-48" />
        <div className="space-y-3">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      </div>
    </AppShell>
  )
}
