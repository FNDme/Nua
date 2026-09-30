import type { NewsFeed } from "~/context/user-preferences.context"

export const HN_SOURCE = {
  id: "hn",
  label: "HN",
  name: "Hacker News",
  homepage: "https://news.ycombinator.com/"
} as const

/** Match pattern that grants access to a feed's host, e.g. "https://example.com/*" */
export const feedOrigin = (url: string) => {
  const { protocol, hostname } = new URL(url)
  return `${protocol}//${hostname}/*`
}

export const feedHomepage = (url: string) => {
  const { protocol, hostname } = new URL(url)
  return `${protocol}//${hostname.replace(/^feeds?\./, "www.")}/`
}

/** "The Verge" -> "Verge", "Ars Technica" -> "Ars" */
export const deriveLabel = (name: string) => {
  const words = name
    .replace(/^the\s+/i, "")
    .trim()
    .split(/\s+/)
  return (words[0] || name).slice(0, 10)
}

/** Parses user input into a normalized https feed URL, or null */
export const parseFeedUrl = (input: string) => {
  const value = input.trim()
  if (!value) return null
  try {
    const url = new URL(
      /^[a-z]+:\/\//i.test(value) ? value : `https://${value}`
    )
    // Only https: optional host access is requested for https origins only
    if (url.protocol === "http:") url.protocol = "https:"
    return url.protocol === "https:" ? url.href : null
  } catch {
    return null
  }
}

// Origins granted at install (manifest host_permissions) can't be released
const requiredOrigins = () =>
  new Set(chrome.runtime.getManifest().host_permissions ?? [])

/** Releases host access no remaining feed needs. Errors are ignored. */
export const releaseUnusedOrigins = async (
  removed: NewsFeed[],
  remaining: NewsFeed[]
) => {
  const keep = new Set([...remaining.map((f) => feedOrigin(f.url))])
  const required = requiredOrigins()
  const origins = [...new Set(removed.map((f) => feedOrigin(f.url)))].filter(
    (origin) => !keep.has(origin) && !required.has(origin)
  )
  if (!origins.length) return
  try {
    await chrome.permissions.remove({ origins })
  } catch {
    // Not granted (or already released): nothing to do
  }
}
