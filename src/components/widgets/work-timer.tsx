import { Check } from "lucide-react"
import { useEffect, useMemo, useState, type CSSProperties } from "react"

import { useUserPreferences } from "~/context/user-preferences.context"
import { cn } from "~/lib/utils"

import { Progress } from "../ui/progress"
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip"

const toMinutes = (time: string) => {
  const [h, m] = time.split(":").map(Number)
  return h * 60 + m
}

const formatDuration = (minutes: number) => {
  const h = Math.floor(minutes / 60)
  const m = Math.round(minutes % 60)
  return h > 0 ? `${h}h ${String(m).padStart(2, "0")}m` : `${m}m`
}

const RING_RADIUS = 17
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS

/**
 * Light arc on a dimmed, blurred disc so it reads on dark and light photos.
 * The viewBox leaves room for the stroke, which used to touch the edges.
 */
function Ring({ progress }: { progress: number }) {
  const done = progress >= 100
  return (
    <div className="relative h-10 w-10 rounded-full bg-black/35 shadow-lg shadow-black/20 backdrop-blur-sm">
      <svg viewBox="0 0 40 40" className="h-full w-full -rotate-90" aria-hidden>
        <circle
          className="stroke-white/15"
          strokeWidth="3.5"
          fill="none"
          r={RING_RADIUS}
          cx="20"
          cy="20"
        />
        {/* A round cap would draw a dot at 0% */}
        {progress > 0 && (
          <circle
            className="stroke-white/90 transition-[stroke-dashoffset] duration-1000"
            strokeWidth="3.5"
            strokeLinecap="round"
            fill="none"
            r={RING_RADIUS}
            cx="20"
            cy="20"
            strokeDasharray={RING_CIRCUMFERENCE}
            strokeDashoffset={RING_CIRCUMFERENCE * (1 - progress / 100)}
          />
        )}
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold tabular-nums text-gray-100">
        {done ? <Check className="h-4 w-4" /> : `${Math.floor(progress)}%`}
      </span>
    </div>
  )
}

/** Progress through the working day (hours and days set in the popup) */
function WorkTimer() {
  const {
    preferences: { workTimer }
  } = useUserPreferences()
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    // The bar moves by the minute; tick a little faster to stay close
    const timer = setInterval(() => setNow(new Date()), 15_000)
    return () => clearInterval(timer)
  }, [])

  const start = toMinutes(workTimer.start)
  const end = toMinutes(workTimer.end)
  const isWorkDay = workTimer.days.includes(now.getDay())

  const { progress, remaining } = useMemo(() => {
    const current =
      now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60
    if (!(end > start) || current <= start)
      return { progress: 0, remaining: end - start }
    if (current >= end) return { progress: 100, remaining: 0 }
    return {
      progress: ((current - start) / (end - start)) * 100,
      remaining: end - current
    }
  }, [now, start, end])

  if (!isWorkDay || !(end > start)) return null

  const label =
    progress === 0
      ? `Starts at ${workTimer.start}`
      : progress === 100
        ? "Done for today"
        : `${formatDuration(remaining)} left`
  const useRing = workTimer.style === "ring"

  return (
    <div
      className={cn(
        // Row fits what's shown: the 40px ring, or (sm+) the thin bar
        "flex h-10 w-full items-center justify-center",
        !useRing && "sm:h-6"
      )}>
      <div
        className={cn(
          "flex w-fit max-w-md items-center gap-3",
          !useRing && "sm:w-1/2"
        )}>
        <Tooltip delayDuration={100}>
          <TooltipTrigger className="flex-1 cursor-default justify-center">
            {/* The bar needs room, so small screens always get the ring */}
            {!useRing && (
              <Progress
                value={progress}
                className="hidden bg-black/20 sm:block"
                style={{ "--primary": "black" } as CSSProperties}
              />
            )}
            <div className={cn(!useRing && "block sm:hidden")}>
              <Ring progress={progress} />
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>
              {Math.round(progress)}% · {label}
            </p>
          </TooltipContent>
        </Tooltip>
        {workTimer.showRemaining && (
          <span className="shrink-0 whitespace-nowrap rounded-full bg-black/20 px-2 py-0.5 text-xs text-gray-200 backdrop-blur-sm">
            {label}
          </span>
        )}
      </div>
    </div>
  )
}

export default WorkTimer
