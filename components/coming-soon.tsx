import type { ComponentType } from "react"

export function ComingSoon({
  icon: Icon,
  title,
  desc,
}: {
  icon: ComponentType<{ className?: string }>
  title: string
  desc: string
}) {
  return (
    <div className="grid min-h-[50vh] place-items-center">
      <div className="max-w-md rounded-[2rem] border border-white/12 bg-white/[0.05] p-10 text-center backdrop-blur">
        <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-2xl border border-[color:var(--accent)]/30 bg-[var(--accent)]/10 text-[color:var(--accent)]">
          <Icon className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="mt-3 leading-7 text-white/55">{desc}</p>
        <span className="mt-6 inline-block rounded-full border border-white/12 bg-white/[0.05] px-4 py-2 text-xs uppercase tracking-[0.2em] text-white/45">
          Wkrótce
        </span>
      </div>
    </div>
  )
}
