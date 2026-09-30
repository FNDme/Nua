import { Storage } from "@plasmohq/storage"

import { PREFERENCES_KEY } from "~/constants"
import {
  advancePhase,
  PHASE_LABELS,
  phaseDuration,
  POMODORO_ALARM,
  readPomodoroSettings,
  readPomodoroState,
  resetTimer,
  savePomodoroState
} from "~/lib/pomodoro"

const isPomodoroEnabled = async () => {
  const preferences = await new Storage().get<{
    widgets?: { pomodoro?: boolean }
  }>(PREFERENCES_KEY)
  return preferences?.widgets?.pomodoro !== false
}

/**
 * Finishes the running Pomodoro phase. Only this worker advances the timer,
 * so several open tabs can't finish the same phase twice.
 */
async function finishPomodoroPhase() {
  const [state, settings] = await Promise.all([
    readPomodoroState(),
    readPomodoroSettings()
  ])
  // Stale alarm: the timer was paused, reset or already advanced
  if (state.status !== "running" || (state.endsAt ?? 0) > Date.now() + 1000) {
    return
  }

  // Pomodoro widget turned off in the popup: stop quietly
  if (!(await isPomodoroEnabled())) {
    await savePomodoroState(resetTimer(state))
    return
  }

  const next = advancePhase(state, settings, { finished: true })
  await savePomodoroState(next)

  if (!settings.notify) return
  const minutes = Math.round(phaseDuration(next.phase, settings) / 60_000)
  const title = state.phase === "focus" ? "Focus session done" : "Break is over"
  const message =
    next.status === "running"
      ? `${PHASE_LABELS[next.phase]} started (${minutes} min).`
      : `Up next: ${PHASE_LABELS[next.phase]} (${minutes} min). Open a new tab to start it.`
  const icons = chrome.runtime.getManifest().icons ?? {}
  chrome.notifications.create(`pomodoro-${Date.now()}`, {
    type: "basic",
    iconUrl: chrome.runtime.getURL(icons["128"] ?? Object.values(icons)[0]),
    title,
    message,
    priority: 2
  })
}

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === POMODORO_ALARM) finishPomodoroPhase()
})

// Clicking the notification opens a new tab, where the timer is
chrome.notifications.onClicked.addListener((id) => {
  if (!id.startsWith("pomodoro-")) return
  chrome.notifications.clear(id)
  chrome.tabs.create({})
})

// If Chrome was closed when a phase ended, catch up on startup
chrome.runtime.onStartup.addListener(() => finishPomodoroPhase())
