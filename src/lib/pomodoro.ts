import { Storage } from "@plasmohq/storage"

import { POMODORO_STATE_KEY, PREFERENCES_KEY } from "~/constants"
import {
  DEFAULT_POMODORO_SETTINGS,
  type PomodoroSettings
} from "~/lib/pomodoro-settings"

export type PomodoroPhase = "focus" | "short" | "long"
export type PomodoroStatus = "idle" | "running" | "paused"

/**
 * One timer shared by every new tab. Kept in local storage and advanced by the
 * background worker when its alarm fires, so it keeps going (and notifies)
 * with no tab open.
 */
export interface PomodoroState {
  phase: PomodoroPhase
  status: PomodoroStatus
  /** Epoch ms when a running phase ends */
  endsAt?: number
  /** Time left in a paused phase */
  remainingMs?: number
  /** Focus sessions finished in the current long-break cycle */
  cycleCount: number
  /** Local date ("YYYY-MM-DD") that todayCount belongs to */
  day: string
  todayCount: number
}

export const POMODORO_ALARM = "pomodoro"

export const PHASE_LABELS: Record<PomodoroPhase, string> = {
  focus: "Focus",
  short: "Short break",
  long: "Long break"
}

export const localDay = (now = Date.now()) => {
  const d = new Date(now)
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export const initialPomodoroState = (now = Date.now()): PomodoroState => ({
  phase: "focus",
  status: "idle",
  cycleCount: 0,
  day: localDay(now),
  todayCount: 0
})

const minutes = (value: number, fallback: number) =>
  (Number.isFinite(value) && value > 0 ? value : fallback) * 60_000

export const phaseDuration = (
  phase: PomodoroPhase,
  settings: PomodoroSettings
) => {
  const d = DEFAULT_POMODORO_SETTINGS
  if (phase === "focus") return minutes(settings.focusMinutes, d.focusMinutes)
  if (phase === "short")
    return minutes(settings.shortBreakMinutes, d.shortBreakMinutes)
  return minutes(settings.longBreakMinutes, d.longBreakMinutes)
}

export const remainingMs = (
  state: PomodoroState,
  settings: PomodoroSettings,
  now = Date.now()
) => {
  if (state.status === "running")
    return Math.max(0, (state.endsAt ?? now) - now)
  if (state.status === "paused")
    return state.remainingMs ?? phaseDuration(state.phase, settings)
  return phaseDuration(state.phase, settings)
}

/** Today's count, reset when the stored day is not today */
const today = (state: PomodoroState, now: number) =>
  state.day === localDay(now)
    ? { day: state.day, todayCount: state.todayCount }
    : { day: localDay(now), todayCount: 0 }

export const startTimer = (
  state: PomodoroState,
  settings: PomodoroSettings,
  now = Date.now()
): PomodoroState => ({
  ...state,
  status: "running",
  endsAt: now + remainingMs(state, settings, now),
  remainingMs: undefined
})

export const pauseTimer = (
  state: PomodoroState,
  settings: PomodoroSettings,
  now = Date.now()
): PomodoroState => ({
  ...state,
  status: "paused",
  remainingMs: remainingMs(state, settings, now),
  endsAt: undefined
})

/** Back to the start of the current phase */
export const resetTimer = (state: PomodoroState): PomodoroState => ({
  ...state,
  status: "idle",
  endsAt: undefined,
  remainingMs: undefined
})

/** Pick a phase by hand (stops the timer) */
export const selectPhase = (
  state: PomodoroState,
  phase: PomodoroPhase
): PomodoroState => ({ ...resetTimer(state), phase })

/**
 * Moves to the next phase. A finished focus session counts towards today and
 * the long-break cycle; a skipped one doesn't.
 */
export const advancePhase = (
  state: PomodoroState,
  settings: PomodoroSettings,
  { finished }: { finished: boolean },
  now = Date.now()
): PomodoroState => {
  const counted = finished && state.phase === "focus"
  const { day, todayCount } = today(state, now)
  const every = Math.max(1, Math.round(settings.longBreakEvery) || 4)

  let cycleCount = counted ? state.cycleCount + 1 : state.cycleCount
  let next: PomodoroPhase
  if (state.phase === "focus") {
    next = counted && cycleCount >= every ? "long" : "short"
  } else {
    next = "focus"
    if (state.phase === "long") cycleCount = 0
  }

  const autoStart =
    next === "focus" ? settings.autoStartFocus : settings.autoStartBreaks
  const base: PomodoroState = {
    phase: next,
    status: "idle",
    cycleCount,
    day,
    todayCount: counted ? todayCount + 1 : todayCount
  }
  return autoStart ? startTimer(base, settings, now) : base
}

// ---- Storage and alarm (used by the new tab and the background worker) ----

const localStorageArea = new Storage({ area: "local" })
// Preferences live in the default (sync) area, see UserPreferencesProvider
const syncStorageArea = new Storage()

export const readPomodoroState = async () =>
  (await localStorageArea.get<PomodoroState>(POMODORO_STATE_KEY)) ??
  initialPomodoroState()

export const readPomodoroSettings = async (): Promise<PomodoroSettings> => {
  const preferences = await syncStorageArea.get<{
    pomodoro?: Partial<PomodoroSettings>
  }>(PREFERENCES_KEY)
  return { ...DEFAULT_POMODORO_SETTINGS, ...preferences?.pomodoro }
}

/** Saves the state and makes the alarm match it */
export const savePomodoroState = async (state: PomodoroState) => {
  await localStorageArea.set(POMODORO_STATE_KEY, state)
  if (state.status === "running" && state.endsAt) {
    await chrome.alarms.create(POMODORO_ALARM, { when: state.endsAt })
  } else {
    await chrome.alarms.clear(POMODORO_ALARM)
  }
}

export { localStorageArea as pomodoroStorage }
