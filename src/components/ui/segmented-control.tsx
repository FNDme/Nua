import { cn } from "~/lib/utils"

export interface SegmentedOption<T extends string> {
  value: T
  label: React.ReactNode
  title?: string
  disabled?: boolean
}

/** A row of mutually exclusive buttons (used on the new tab and in settings) */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  compact,
  className,
  "aria-label": ariaLabel
}: {
  options: SegmentedOption<T>[]
  value: T
  onChange: (value: T) => void
  compact?: boolean
  className?: string
  "aria-label"?: string
}) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={cn("flex shrink-0 rounded-md bg-white/5 p-0.5", className)}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={option.value === value}
          title={option.title}
          disabled={option.disabled}
          onClick={() => onChange(option.value)}
          className={cn(
            "flex-1 whitespace-nowrap rounded py-0.5 text-xs text-muted-foreground transition-colors hover:text-foreground disabled:pointer-events-none disabled:opacity-40",
            compact ? "px-1.5" : "px-2",
            option.value === value && "bg-white/10 text-foreground"
          )}>
          {option.label}
        </button>
      ))}
    </div>
  )
}
