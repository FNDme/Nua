// No React imports: this is also bundled into the background worker

export interface PomodoroSettings {
  focusMinutes: number
  shortBreakMinutes: number
  longBreakMinutes: number
  /** A long break follows every N focus sessions */
  longBreakEvery: number
  autoStartBreaks: boolean
  autoStartFocus: boolean
  notify: boolean
}

export const DEFAULT_POMODORO_SETTINGS: PomodoroSettings = {
  focusMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  longBreakEvery: 4,
  autoStartBreaks: true,
  autoStartFocus: false,
  notify: true
}
