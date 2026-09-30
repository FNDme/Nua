import { Pause, Play, RotateCcw, SkipForward, Timer } from "lucide-react"
import { useEffect, useState } from "react"

import { useStorage } from "@plasmohq/storage/hook"

import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "~/components/ui/popover"
import { POMODORO_STATE_KEY } from "~/constants"
import { useUserPreferences } from "~/context/user-preferences.context"
import { openSettings } from "~/lib/open-settings"
import {
  advancePhase,
  initialPomodoroState,
  localDay,
  pauseTimer,
  PHASE_LABELS,
  pomodoroStorage,
  remainingMs,
  resetTimer,
  savePomodoroState,
  selectPhase,
  startTimer,
  type PomodoroPhase,
  type PomodoroState
} from "~/lib/pomodoro"
import { cn } from "~/lib/utils"

const PHASES: PomodoroPhase[] = ["focus", "short", "long"]

const formatClock = (ms: number) => {
  const total = Math.ceil(ms / 1000)
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
}

function ControlButton({
  label,
  onClick,
  children,
  primary
}: {
  label: string
  onClick: () => void
  children: React.ReactNode
  primary?: boolean
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className={cn(
        "flex h-9 items-center justify-center gap-1.5 rounded-full px-3 text-sm transition-colors",
        primary
          ? "bg-white/90 font-medium text-zinc-900 hover:bg-white"
          : "bg-white/10 text-gray-200 hover:bg-white/20"
      )}>
      {children}
    </button>
  )
}

function Pomodoro() {
  const {
    preferences: { pomodoro: settings }
  } = useUserPreferences()
  const [stored] = useStorage<PomodoroState>(
    { key: POMODORO_STATE_KEY, instance: pomodoroStorage },
    (v) => v ?? initialPomodoroState()
  )
  const state = stored ?? initialPomodoroState()

  // Re-render every second while running
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    if (state.status !== "running") return
    setNow(Date.now())
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [state.status, state.endsAt])

  const left = remainingMs(state, settings, now)
  const isRunning = state.status === "running"
  const isBreak = state.phase !== "focus"
  const todayCount = state.day === localDay(now) ? state.todayCount : 0
  const every = Math.max(1, Math.round(settings.longBreakEvery) || 4)

  const update = (next: PomodoroState) => savePomodoroState(next)

  return (
    <Popover>
      <PopoverTrigger
        title={`${PHASE_LABELS[state.phase]} timer`}
        className={cn(
          "flex items-center gap-1.5 rounded-full bg-black/20 px-3 py-1 text-sm font-light text-gray-200 transition-all duration-300 hover:scale-105 hover:bg-black/50",
          isRunning && (isBreak ? "bg-emerald-500/20" : "bg-rose-500/20")
        )}>
        <Timer className="h-4 w-4 opacity-70" />
        <span className="tabular-nums">
          {state.status === "idle" && !isBreak ? "Focus" : formatClock(left)}
        </span>
      </PopoverTrigger>
      <PopoverContent
        className="w-72 p-4"
        // Focusing the first phase button would make it look selected
        onOpenAutoFocus={(e) => e.preventDefault()}>
        <div className="flex rounded-md bg-white/5 p-0.5" role="tablist">
          {PHASES.map((phase) => (
            <button
              key={phase}
              type="button"
              role="tab"
              aria-selected={phase === state.phase}
              onClick={() => update(selectPhase(state, phase))}
              className={cn(
                "flex-1 rounded px-2 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground",
                phase === state.phase && "bg-white/10 text-foreground"
              )}>
              {PHASE_LABELS[phase]}
            </button>
          ))}
        </div>

        <div
          className="my-4 text-center text-5xl font-semibold tabular-nums"
          aria-live="polite">
          {formatClock(left)}
        </div>

        <div className="flex items-center justify-center gap-2">
          {isRunning ? (
            <ControlButton
              primary
              label="Pause"
              onClick={() => update(pauseTimer(state, settings))}>
              <Pause className="h-4 w-4" />
              Pause
            </ControlButton>
          ) : (
            <ControlButton
              primary
              label={state.status === "paused" ? "Resume" : "Start"}
              onClick={() => update(startTimer(state, settings))}>
              <Play className="h-4 w-4" />
              {state.status === "paused" ? "Resume" : "Start"}
            </ControlButton>
          )}
          <ControlButton
            label="Reset"
            onClick={() => update(resetTimer(state))}>
            <RotateCcw className="h-4 w-4" />
          </ControlButton>
          <ControlButton
            label="Skip to next phase"
            onClick={() =>
              update(advancePhase(state, settings, { finished: false }))
            }>
            <SkipForward className="h-4 w-4" />
          </ControlButton>
        </div>

        <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
          <div
            className="flex items-center gap-1"
            title={`Long break after ${every} focus sessions`}>
            {Array.from({ length: every }).map((_, i) => (
              <span
                key={i}
                className={cn(
                  "h-2 w-2 rounded-full bg-white/15",
                  i < state.cycleCount && "bg-rose-400"
                )}
              />
            ))}
          </div>
          <span>
            Today: {todayCount} session{todayCount === 1 ? "" : "s"}
          </span>
        </div>
        <button
          type="button"
          onClick={() => openSettings("timers")}
          className="mt-3 w-full text-center text-xs text-muted-foreground hover:text-foreground hover:underline">
          Timer settings
        </button>
      </PopoverContent>
    </Popover>
  )
}

export default Pomodoro
