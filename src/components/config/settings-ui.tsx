import type { ReactNode } from "react"

import { cn } from "~/lib/utils"

/** A titled card grouping related settings */
export function Section({
  title,
  description,
  action,
  children,
  className
}: {
  title: string
  description?: ReactNode
  action?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section
      className={cn(
        "space-y-3 rounded-xl border border-white/10 bg-white/[0.03] p-4",
        className
      )}>
      <header className="flex items-start justify-between gap-3">
        <div className="space-y-0.5">
          <h2 className="text-sm font-semibold text-foreground">{title}</h2>
          {description && (
            <p className="text-xs leading-relaxed text-muted-foreground">
              {description}
            </p>
          )}
        </div>
        {action}
      </header>
      {children}
    </section>
  )
}

/** Label (and optional hint) on the left, control on the right */
export function Row({
  label,
  hint,
  htmlFor,
  children
}: {
  label: ReactNode
  hint?: ReactNode
  htmlFor?: string
  children: ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <label htmlFor={htmlFor} className="min-w-0 space-y-0.5">
        <span className="block text-sm text-foreground">{label}</span>
        {hint && (
          <span className="block text-xs text-muted-foreground">{hint}</span>
        )}
      </label>
      <div className="flex shrink-0 items-center gap-2">{children}</div>
    </div>
  )
}

export function Switch({
  checked,
  onChange,
  label,
  id,
  disabled
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  /** Accessible name when there's no visible <label htmlFor> */
  label?: string
  id?: string
  disabled?: boolean
}) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40",
        checked ? "bg-rose-400" : "bg-white/15"
      )}>
      <span
        className={cn(
          "inline-block h-4 w-4 rounded-full bg-white shadow transition-transform",
          checked ? "translate-x-[18px]" : "translate-x-0.5"
        )}
      />
    </button>
  )
}
