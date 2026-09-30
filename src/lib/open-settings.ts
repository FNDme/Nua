import { Storage } from "@plasmohq/storage"

import { SETTINGS_TAB_KEY } from "~/constants"

export type SettingsTab =
  | "widgets"
  | "background"
  | "timers"
  | "currency"
  | "news"
  | "keys"

const localStorageArea = new Storage({ area: "local" })

/**
 * Opens the extension popup on a given tab. chrome.action.openPopup needs
 * Chrome 127+; elsewhere the settings open as a regular tab instead.
 */
export async function openSettings(tab?: SettingsTab) {
  if (tab) await localStorageArea.set(SETTINGS_TAB_KEY, tab).catch(() => {})
  const action = chrome.action as typeof chrome.action & {
    openPopup?: () => Promise<void>
  }
  try {
    if (!action.openPopup) throw new Error("unsupported")
    await action.openPopup()
  } catch {
    chrome.tabs.create({ url: chrome.runtime.getURL("popup.html") })
  }
}

/** Reads (and clears) the tab requested by openSettings */
export async function takeRequestedSettingsTab() {
  const tab = await localStorageArea.get<SettingsTab>(SETTINGS_TAB_KEY)
  if (tab) await localStorageArea.remove(SETTINGS_TAB_KEY)
  return tab
}
