import { useEffect, useState } from "react"

/**
 * Whether the extension can fetch from `origin` (a match pattern such as
 * "https://example.com/*"). Updates when access is granted or revoked, from
 * this page, the popup or chrome://extensions.
 */
export function useHostPermission(origin?: string) {
  const [granted, setGranted] = useState<boolean | undefined>(undefined)

  useEffect(() => {
    if (!origin) return
    let active = true
    const check = () =>
      chrome.permissions
        .contains({ origins: [origin] })
        .then((value) => active && setGranted(value))
        .catch(() => active && setGranted(false))

    // @types/chrome 0.0.258 omits removeListener on these events
    type Event = {
      addListener: (cb: () => void) => void
      removeListener: (cb: () => void) => void
    }
    const events = [
      chrome.permissions.onAdded,
      chrome.permissions.onRemoved
    ] as unknown as Event[]

    setGranted(undefined)
    check()
    events.forEach((event) => event.addListener(check))
    return () => {
      active = false
      events.forEach((event) => event.removeListener(check))
    }
  }, [origin])

  return granted
}

/**
 * Asks Chrome for access to `origin`. Must be called directly from a click
 * handler (before any await), or Chrome rejects it for lacking a user gesture.
 */
export const requestHostPermission = (origin: string) =>
  chrome.permissions.request({ origins: [origin] }).catch(() => false)
