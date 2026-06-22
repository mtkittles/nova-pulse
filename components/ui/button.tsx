import Link from "next/link"
import type { ButtonHTMLAttributes, ReactNode } from "react"

// Button — warianty: primary (cyan), secondary (outline), ghost. Rozmiary sm/md/lg.
// Z `href` renderuje <Link>, inaczej <button>.
export type ButtonVariant = "primary" | "secondary" | "ghost"
export type ButtonSize = "sm" | "md" | "lg"

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.97]"

const VARIANTS: Record<ButtonVariant, string> = {
  primary: "bg-[var(--cyan)] text-[color:var(--bg-0)] hover:bg-[var(--cyan-strong)] hover:scale-[1.02]",
  secondary:
    "border border-[color:var(--border-strong)] bg-transparent text-[color:var(--text-primary)] hover:bg-[var(--cyan-soft)] hover:scale-[1.02]",
  ghost:
    "bg-transparent text-[color:var(--text-secondary)] hover:bg-[var(--surface-2)] hover:text-[color:var(--text-primary)] hover:scale-[1.02]",
}

const SIZES: Record<ButtonSize, string> = {
  sm: "px-3.5 py-1.5 text-sm",
  md: "px-5 py-2.5 text-sm",
  lg: "px-6 py-3 text-base",
}

export function buttonClass(variant: ButtonVariant = "primary", size: ButtonSize = "md", className = ""): string {
  return `${BASE} ${VARIANTS[variant]} ${SIZES[size]} ${className}`
}

type Props = {
  variant?: ButtonVariant
  size?: ButtonSize
  className?: string
  href?: string
  children: ReactNode
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children">

export function Button({ variant = "primary", size = "md", className = "", href, children, ...rest }: Props) {
  const cls = buttonClass(variant, size, className)
  if (href) {
    return (
      <Link href={href} className={cls}>
        {children}
      </Link>
    )
  }
  return (
    <button className={cls} {...rest}>
      {children}
    </button>
  )
}
