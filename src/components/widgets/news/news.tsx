import {
  getHackerNewsItemUrl,
  getStories,
  getTopStoryIds
} from "@/hooks/data/hacker-news.data"
import { getFeed, InvalidFeedError } from "@/hooks/data/rss.data"
import {
  requestHostPermission,
  useHostPermission
} from "@/hooks/host-permission"
import {
  keepPreviousData,
  useQuery,
  useQueryClient
} from "@tanstack/react-query"
import { ChevronLeft, ChevronRight, RefreshCw, Settings2 } from "lucide-react"
import { useEffect, useRef, useState, type ReactNode } from "react"

import {
  useUserPreferences,
  type NewsFeed
} from "~/context/user-preferences.context"
import { openSettings } from "~/lib/open-settings"
import { cn } from "~/lib/utils"

import IconButton from "../../shared/icon-button"
import { feedHomepage, feedOrigin, HN_SOURCE } from "./sources"

const PAGE_SIZE = 5
const REFRESH_INTERVAL = 1000 * 60 * 15 // 15 minutes

interface Row {
  id: string
  title: string
  url: string
  meta: ReactNode[]
}

const getDomain = (url?: string) => {
  if (!url) return null
  try {
    return new URL(url).hostname.replace(/^www\./, "")
  } catch {
    return null
  }
}

const relativeTime = new Intl.RelativeTimeFormat(undefined, {
  numeric: "auto",
  style: "short"
})

const timeAgo = (ms: number) => {
  const minutes = Math.round((ms - Date.now()) / 60000)
  if (Math.abs(minutes) < 60) return relativeTime.format(minutes, "minute")
  const hours = Math.round(minutes / 60)
  if (Math.abs(hours) < 24) return relativeTime.format(hours, "hour")
  return relativeTime.format(Math.round(hours / 24), "day")
}

const linkProps = { target: "_blank", rel: "noopener noreferrer" } as const

/** One page of Hacker News top stories; only that page's items are fetched */
function useHackerNews(page: number, enabled: boolean) {
  const queryClient = useQueryClient()
  const ids = useQuery({
    queryKey: ["news", "hn", "ids"],
    queryFn: getTopStoryIds,
    enabled,
    staleTime: REFRESH_INTERVAL,
    refetchInterval: enabled && REFRESH_INTERVAL
  })

  const pageIds = (ids.data ?? []).slice(
    page * PAGE_SIZE,
    (page + 1) * PAGE_SIZE
  )
  const stories = useQuery({
    queryKey: ["news", "hn", "items", pageIds],
    queryFn: () => getStories(pageIds),
    enabled: enabled && pageIds.length > 0,
    staleTime: REFRESH_INTERVAL,
    placeholderData: keepPreviousData
  })

  // Make "next" instant
  useEffect(() => {
    if (!enabled || !ids.data) return
    const nextIds = ids.data.slice(
      (page + 1) * PAGE_SIZE,
      (page + 2) * PAGE_SIZE
    )
    if (nextIds.length) {
      queryClient.prefetchQuery({
        queryKey: ["news", "hn", "items", nextIds],
        queryFn: () => getStories(nextIds),
        staleTime: REFRESH_INTERVAL
      })
    }
  }, [enabled, ids.data, page, queryClient])

  const rows: Row[] | undefined = stories.data?.map((story) => {
    const commentsUrl = getHackerNewsItemUrl(story.id)
    const domain = getDomain(story.url)
    return {
      id: String(story.id),
      title: story.title,
      url: story.url ?? commentsUrl,
      meta: [
        `${story.score} points`,
        <a
          key="comments"
          href={commentsUrl}
          {...linkProps}
          className="hover:text-gray-200 hover:underline">
          {story.descendants ?? 0} comments
        </a>,
        domain && <span className="truncate">{domain}</span>
      ].filter(Boolean)
    }
  })

  return {
    rows,
    total: ids.data?.length ?? 0,
    isLoading: ids.isLoading || (stories.isLoading && pageIds.length > 0),
    isFetching: ids.isFetching || stories.isFetching,
    isError: ids.isError || stories.isError,
    refetch: () => {
      ids.refetch()
      stories.refetch()
    }
  }
}

/** One page of an RSS/Atom feed; the whole feed is fetched once and paged locally */
function useFeed(feed: NewsFeed | undefined, page: number, enabled: boolean) {
  const query = useQuery({
    queryKey: ["news", "feed", feed?.url],
    queryFn: () => getFeed(feed.url),
    enabled: enabled && !!feed,
    staleTime: REFRESH_INTERVAL,
    refetchInterval: enabled && REFRESH_INTERVAL,
    // A page that isn't a feed won't become one by retrying
    retry: (count, error) => !(error instanceof InvalidFeedError) && count < 2
  })

  const rows: Row[] | undefined = query.data?.items
    .slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
    .map((item) => ({
      id: item.id,
      title: item.title,
      url: item.url,
      meta: [
        item.publishedAt && timeAgo(item.publishedAt),
        getDomain(item.url)
      ].filter(Boolean)
    }))

  return {
    rows,
    total: query.data?.items.length ?? 0,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    isInvalid: query.error instanceof InvalidFeedError,
    homepage: query.data?.homepage,
    refetch: () => query.refetch()
  }
}

function News() {
  const {
    preferences: { news },
    updateNews
  } = useUserPreferences()
  const feeds = news?.feeds ?? []
  const activeFeed = feeds.find((f) => f.id === news?.source)
  const isHN = !activeFeed
  const source = activeFeed
    ? {
        id: activeFeed.id,
        label: activeFeed.label,
        name: activeFeed.name,
        homepage: feedHomepage(activeFeed.url)
      }
    : HN_SOURCE
  const [page, setPage] = useState(0)

  const origin = activeFeed && feedOrigin(activeFeed.url)
  const hasAccess = useHostPermission(origin)
  const needsAccess = !isHN && hasAccess === false

  // Both hooks always run (rules of hooks); only the active one fetches
  const hn = useHackerNews(page, isHN)
  const feed = useFeed(activeFeed, page, !isHN && hasAccess === true)
  const { rows, total, isLoading, isFetching, isError, refetch } = isHN
    ? hn
    : feed

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE))

  // A refreshed list can be shorter than the page we were on
  useEffect(() => {
    if (page > pageCount - 1) setPage(pageCount - 1)
  }, [page, pageCount])

  // Removing the active feed (e.g. from the popup) falls back to HN
  useEffect(() => {
    setPage(0)
  }, [source.id])

  // Many feeds: the tab row scrolls; keep the active tab visible
  const tabsRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    tabsRef.current
      ?.querySelector<HTMLElement>("[aria-selected=true]")
      ?.scrollIntoView({ block: "nearest", inline: "nearest" })
  }, [source.id, feeds.length])

  const tabs = [HN_SOURCE, ...feeds]

  return (
    <div className="w-72 rounded-2xl bg-black/20 p-3 text-gray-200 shadow-lg shadow-black/20 backdrop-blur-sm">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div
          ref={tabsRef}
          role="tablist"
          aria-label="News source"
          className="flex min-w-0 gap-0.5 overflow-x-auto [scrollbar-width:none]">
          {tabs.map((s) => (
            <button
              key={s.id}
              type="button"
              role="tab"
              aria-selected={s.id === source.id}
              title={s.name}
              onClick={() => updateNews({ source: s.id })}
              className={cn(
                "shrink-0 whitespace-nowrap rounded-md px-2 py-0.5 text-xs text-gray-400 transition-colors hover:text-gray-100",
                s.id === source.id && "bg-white/10 font-medium text-gray-100"
              )}>
              {s.label}
            </button>
          ))}
        </div>
        <IconButton
          title="Refresh"
          className="h-7 w-7 shrink-0 shadow-none"
          disabled={isFetching || needsAccess}
          onClick={refetch}>
          <RefreshCw
            opacity={0.6}
            className={cn(isFetching && "animate-spin")}
          />
        </IconButton>
      </div>

      <div role="tabpanel" aria-label={source.name}>
        {needsAccess ? (
          <div className="space-y-2 py-2 text-sm text-gray-300">
            <p>
              Nua needs permission to read{" "}
              <span className="font-medium text-gray-100">
                {getDomain(activeFeed.url)}
              </span>{" "}
              to show this feed.
            </p>
            <button
              type="button"
              onClick={() => requestHostPermission(origin)}
              className="rounded-md bg-white/10 px-3 py-1 text-xs font-medium text-gray-100 hover:bg-white/20">
              Allow access
            </button>
          </div>
        ) : isLoading || (!isHN && hasAccess === undefined) ? (
          <ol className="space-y-2">
            {Array.from({ length: PAGE_SIZE }).map((_, i) => (
              <li
                key={i}
                className="h-8 animate-pulse rounded-md bg-white/10"
              />
            ))}
          </ol>
        ) : isError && !rows?.length ? (
          <p className="py-2 text-sm text-gray-300">
            {!isHN && feed.isInvalid
              ? `${source.name} isn't a valid RSS or Atom feed. Check its URL in Nua's settings.`
              : `Couldn't load ${source.name}.`}
          </p>
        ) : !rows?.length ? (
          <p className="py-2 text-sm text-gray-300">No stories.</p>
        ) : (
          <ol className="space-y-1">
            {rows.map((row, index) => (
              <li key={row.id} className="flex gap-2 text-sm leading-tight">
                <span className="w-4 shrink-0 text-right text-xs leading-5 text-gray-400">
                  {page * PAGE_SIZE + index + 1}
                </span>
                <div className="min-w-0 flex-1 py-0.5">
                  <a
                    href={row.url}
                    {...linkProps}
                    title={row.title}
                    className="line-clamp-1 font-medium hover:underline">
                    {row.title}
                  </a>
                  <div className="flex gap-1 truncate text-xs text-gray-400">
                    {row.meta.map((item, i) => (
                      <span key={i} className="flex min-w-0 gap-1">
                        {i > 0 && <span>·</span>}
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>

      <div className="mt-2 flex items-center justify-between gap-2 text-xs text-gray-400">
        <div className="flex min-w-0 items-center gap-1">
          <a
            href={(!isHN && feed.homepage) || source.homepage}
            {...linkProps}
            className="truncate hover:text-gray-200 hover:underline">
            {source.name}
          </a>
          <button
            type="button"
            title="Manage feeds (Nua toolbar button)"
            aria-label="Manage feeds"
            onClick={() => openSettings("news")}
            className="shrink-0 rounded p-0.5 hover:bg-white/10 hover:text-gray-100">
            <Settings2 className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            aria-label="Previous page"
            disabled={page === 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            className="rounded p-0.5 hover:bg-white/10 hover:text-gray-100 disabled:pointer-events-none disabled:opacity-30">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="tabular-nums">
            {page + 1} / {pageCount}
          </span>
          <button
            type="button"
            aria-label="Next page"
            disabled={page >= pageCount - 1}
            onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
            className="rounded p-0.5 hover:bg-white/10 hover:text-gray-100 disabled:pointer-events-none disabled:opacity-30">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default News
