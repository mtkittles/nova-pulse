import { AppShell } from "@/components/app-shell"
import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <AppShell loggedIn>
      <div className="mx-auto max-w-2xl space-y-6">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    </AppShell>
  )
}
