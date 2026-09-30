import axios from "axios"

export interface FeedItem {
  id: string
  title: string
  url: string
  /** Epoch milliseconds, when the feed provides a date */
  publishedAt?: number
}

// Atom titles with type="html" (and some RSS titles) arrive entity-encoded,
// e.g. "Apple&#8217;s". Parsing as inert HTML decodes them to plain text.
const decode = (text: string) =>
  new DOMParser().parseFromString(text, "text/html").documentElement
    .textContent ?? ""

const safeUrl = (value?: string | null) => {
  if (!value) return null
  try {
    const url = new URL(value.trim())
    return url.protocol === "https:" || url.protocol === "http:"
      ? url.href
      : null
  } catch {
    return null
  }
}

const text = (parent: Element, selector: string) =>
  parent.querySelector(selector)?.textContent?.trim() ?? ""

const toTime = (value: string) => {
  const time = Date.parse(value)
  return Number.isNaN(time) ? undefined : time
}

const parseRss = (doc: Document): FeedItem[] =>
  Array.from(doc.querySelectorAll("item")).flatMap((item) => {
    const url = safeUrl(text(item, "link"))
    const title = decode(text(item, "title"))
    if (!url || !title) return []
    return [
      {
        id: text(item, "guid") || url,
        title,
        url,
        publishedAt: toTime(text(item, "pubDate"))
      }
    ]
  })

const parseAtom = (doc: Document): FeedItem[] =>
  Array.from(doc.querySelectorAll("entry")).flatMap((entry) => {
    const links = Array.from(entry.querySelectorAll("link"))
    const link =
      links.find(
        (l) => (l.getAttribute("rel") ?? "alternate") === "alternate"
      ) ?? links[0]
    const url = safeUrl(link?.getAttribute("href"))
    const title = decode(text(entry, "title"))
    if (!url || !title) return []
    return [
      {
        id: text(entry, "id") || url,
        title,
        url,
        publishedAt: toTime(text(entry, "published") || text(entry, "updated"))
      }
    ]
  })

export interface Feed {
  /** The feed's own title, when it has one */
  title?: string
  /** The site the feed belongs to, when it says */
  homepage?: string
  items: FeedItem[]
}

export class InvalidFeedError extends Error {
  constructor(feedUrl: string) {
    super(`Not an RSS or Atom feed: ${feedUrl}`)
  }
}

/**
 * Fetches and parses an RSS 2.0 or Atom feed. The page needs host access to
 * the feed (manifest host_permissions or a granted optional permission).
 */
export const getFeed = async (feedUrl: string): Promise<Feed> => {
  const { data } = await axios.get<string>(feedUrl, {
    responseType: "text",
    timeout: 15000
  })
  const doc = new DOMParser().parseFromString(data, "application/xml")
  const root = doc.documentElement.localName
  if (doc.querySelector("parsererror") || (root !== "feed" && root !== "rss")) {
    throw new InvalidFeedError(feedUrl)
  }
  // Atom: <feed><title>; RSS: <rss><channel><title> (not an item's title)
  const titleEl =
    root === "feed"
      ? doc.querySelector("feed > title")
      : doc.querySelector("channel > title")
  const title = decode(titleEl?.textContent?.trim() ?? "") || undefined
  const homepage =
    root === "feed"
      ? safeUrl(
          Array.from(doc.querySelectorAll("feed > link"))
            .find((l) => (l.getAttribute("rel") ?? "alternate") === "alternate")
            ?.getAttribute("href")
        )
      : safeUrl(doc.querySelector("channel > link")?.textContent)
  return {
    title,
    homepage: homepage ?? undefined,
    items: root === "feed" ? parseAtom(doc) : parseRss(doc)
  }
}
