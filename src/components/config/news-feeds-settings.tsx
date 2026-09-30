import { useQuery } from "@tanstack/react-query"
import { GripVertical, Loader2, Plus, RotateCcw, X } from "lucide-react"
import { useState, type FormEvent } from "react"

import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import {
  deriveLabel,
  feedOrigin,
  HN_SOURCE,
  parseFeedUrl,
  releaseUnusedOrigins
} from "~/components/widgets/news/sources"
import {
  DEFAULT_NEWS_FEEDS,
  useUserPreferences,
  type NewsFeed
} from "~/context/user-preferences.context"
import { getFeed, InvalidFeedError } from "~/hooks/data/rss.data"
import {
  requestHostPermission,
  useHostPermission
} from "~/hooks/host-permission"
import { cn } from "~/lib/utils"

import { Section } from "./settings-ui"

const hostOf = (url: string) =>
  new URL(url).hostname.replace(/^(www|feeds?)\./, "")

/** Live status of one feed: access, then whether it parses */
function FeedStatus({ feed }: { feed: NewsFeed }) {
  const origin = feedOrigin(feed.url)
  const granted = useHostPermission(origin)
  const { data, error, isLoading } = useQuery({
    queryKey: ["news", "feed", feed.url],
    queryFn: () => getFeed(feed.url),
    enabled: granted === true,
    staleTime: 1000 * 60 * 15,
    retry: (count, err) => !(err instanceof InvalidFeedError) && count < 1
  })

  if (granted === false) {
    return (
      <button
        type="button"
        onClick={() => requestHostPermission(origin)}
        className="shrink-0 rounded bg-amber-500/15 px-1.5 py-0.5 text-[11px] text-amber-300 hover:bg-amber-500/25"
        title={`Allow Nua to read ${hostOf(feed.url)}`}>
        Allow access
      </button>
    )
  }
  if (granted === undefined || isLoading) {
    return (
      <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-muted-foreground" />
    )
  }
  if (error) {
    return (
      <span
        className="shrink-0 text-[11px] text-red-400"
        title={error instanceof Error ? error.message : undefined}>
        {error instanceof InvalidFeedError ? "Not a feed" : "Can't load"}
      </span>
    )
  }
  return (
    <span className="shrink-0 text-[11px] text-muted-foreground">
      {data?.items.length ?? 0} items
    </span>
  )
}

function NewsFeedsSettings() {
  const { preferences, updateNewsFeeds } = useUserPreferences()
  const feeds = preferences.news?.feeds ?? []

  const [url, setUrl] = useState("")
  const [name, setName] = useState("")
  const [label, setLabel] = useState("")
  const [message, setMessage] = useState<{
    tone: "info" | "error"
    text: string
  } | null>(null)
  const [isAdding, setIsAdding] = useState(false)
  const [dragIndex, setDragIndex] = useState<number | null>(null)

  const move = (from: number, to: number) => {
    if (from === to || to < 0 || to >= feeds.length) return
    updateNewsFeeds((current) => {
      const next = [...current]
      const [item] = next.splice(from, 1)
      next.splice(to, 0, item)
      return next
    })
  }

  const remove = (feed: NewsFeed) => {
    const remaining = feeds.filter((f) => f.id !== feed.id)
    updateNewsFeeds((current) => current.filter((f) => f.id !== feed.id))
    releaseUnusedOrigins([feed], remaining)
  }

  const resetToDefaults = () => {
    const defaultUrls = new Set(DEFAULT_NEWS_FEEDS.map((f) => f.url))
    updateNewsFeeds(() => DEFAULT_NEWS_FEEDS)
    releaseUnusedOrigins(
      feeds.filter((f) => !defaultUrls.has(f.url)),
      DEFAULT_NEWS_FEEDS
    )
    setMessage(null)
  }

  const handleAdd = (e: FormEvent) => {
    e.preventDefault()
    setMessage(null)

    const feedUrl = parseFeedUrl(url)
    if (!feedUrl) {
      setMessage({ tone: "error", text: "Enter a valid feed URL (https)." })
      return
    }
    if (feeds.some((f) => f.url === feedUrl)) {
      setMessage({ tone: "error", text: "That feed is already in the list." })
      return
    }

    const typedName = name.trim()
    const typedLabel = label.trim()
    const fallbackName = typedName || hostOf(feedUrl)
    const feed: NewsFeed = {
      id: crypto.randomUUID(),
      url: feedUrl,
      name: fallbackName,
      label: typedLabel || deriveLabel(fallbackName)
    }

    // Save first: Chrome's permission prompt can close this popup, and the
    // new tab then offers "Allow access" for the saved feed.
    updateNewsFeeds((current) => [...current, feed])
    setUrl("")
    setName("")
    setLabel("")
    setIsAdding(true)

    // Called synchronously from the submit handler to keep the user gesture
    requestHostPermission(feedOrigin(feedUrl))
      .then(async (granted) => {
        if (!granted) {
          setMessage({
            tone: "info",
            text: `Saved. Allow access to ${hostOf(feedUrl)} to load it.`
          })
          return
        }
        try {
          const { title } = await getFeed(feedUrl)
          // Name it after the feed unless the user typed a name
          if (title && !typedName) {
            updateNewsFeeds((current) =>
              current.map((f) =>
                f.id === feed.id
                  ? {
                      ...f,
                      name: title,
                      label: typedLabel || deriveLabel(title)
                    }
                  : f
              )
            )
          }
          setMessage({ tone: "info", text: `Added ${title || fallbackName}.` })
        } catch (err) {
          setMessage({
            tone: "error",
            text:
              err instanceof InvalidFeedError
                ? "Saved, but that URL isn't an RSS or Atom feed. Remove it or check the address."
                : "Saved, but the feed couldn't be loaded right now."
          })
        }
      })
      .finally(() => setIsAdding(false))
  }

  return (
    <Section
      title="News feeds"
      description="Tabs of the news widget. Drag to reorder; adding a feed asks for access to its site."
      action={
        <Button
          variant="ghost"
          size="sm"
          className="h-7 shrink-0 px-2 text-xs"
          onClick={resetToDefaults}
          title="Restore the default feeds">
          <RotateCcw className="h-3.5 w-3.5" />
          Reset
        </Button>
      }>
      <ul className="divide-y divide-border rounded-md border border-white/10 text-sm">
        <li className="flex items-center gap-2 px-2 py-1.5 text-muted-foreground">
          <span className="w-4" />
          <span className="w-14 shrink-0 truncate text-xs font-medium">
            {HN_SOURCE.label}
          </span>
          <span className="min-w-0 flex-1 truncate">{HN_SOURCE.name}</span>
          <span className="text-[11px]">Built in</span>
        </li>
        {feeds.map((feed, index) => (
          <li
            key={feed.id}
            draggable
            onDragStart={(e) => {
              setDragIndex(index)
              e.dataTransfer.effectAllowed = "move"
            }}
            onDragOver={(e) => {
              if (dragIndex === null) return
              e.preventDefault()
              if (dragIndex !== index) {
                move(dragIndex, index)
                setDragIndex(index)
              }
            }}
            onDragEnd={() => setDragIndex(null)}
            className={cn(
              "flex items-center gap-2 px-2 py-1.5",
              dragIndex === index && "opacity-50"
            )}>
            <button
              type="button"
              aria-label={`Reorder ${feed.name} (Alt+Up/Down)`}
              title="Drag to reorder (or Alt+↑/↓)"
              onKeyDown={(e) => {
                if (!e.altKey) return
                if (e.key === "ArrowUp") move(index, index - 1)
                if (e.key === "ArrowDown") move(index, index + 1)
              }}
              className="w-4 shrink-0 cursor-grab text-muted-foreground hover:text-foreground">
              <GripVertical className="h-4 w-4" />
            </button>
            <span className="w-14 shrink-0 truncate text-xs font-medium">
              {feed.label}
            </span>
            <span className="min-w-0 flex-1 truncate" title={feed.url}>
              {feed.name}
            </span>
            <FeedStatus feed={feed} />
            <button
              type="button"
              aria-label={`Remove ${feed.name}`}
              title="Remove"
              onClick={() => remove(feed)}
              className="shrink-0 rounded p-0.5 text-muted-foreground hover:bg-accent hover:text-foreground">
              <X className="h-3.5 w-3.5" />
            </button>
          </li>
        ))}
      </ul>

      <form onSubmit={handleAdd} className="space-y-2">
        <div className="flex gap-2">
          <Input
            placeholder="https://example.com/feed.xml"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            aria-label="Feed URL"
            inputMode="url"
          />
          <Button
            type="submit"
            variant="outline"
            disabled={!url.trim() || isAdding}>
            {isAdding ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            Add
          </Button>
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="Name (optional)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-label="Feed name"
          />
          <Input
            placeholder="Tab label"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            aria-label="Tab label"
            maxLength={10}
            className="w-32"
          />
        </div>
      </form>

      {message && (
        <p
          role="status"
          className={cn(
            "text-xs",
            message.tone === "error" ? "text-red-400" : "text-muted-foreground"
          )}>
          {message.text}
        </p>
      )}
    </Section>
  )
}

export default NewsFeedsSettings
