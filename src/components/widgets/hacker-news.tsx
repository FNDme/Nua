import {
  getHackerNewsItemUrl,
  getTopStories
} from "@/hooks/data/hacker-news.data"
import { useQuery } from "@tanstack/react-query"
import { RefreshCw } from "lucide-react"

import { cn } from "~/lib/utils"

import IconButton from "../shared/icon-button"

const REFRESH_INTERVAL = 1000 * 60 * 15 // 15 minutes

const getDomain = (url?: string) => {
  if (!url) return null
  try {
    return new URL(url).hostname.replace(/^www\./, "")
  } catch {
    return null
  }
}

function HackerNewsIcon() {
  return (
    <span
      aria-hidden
      className="flex size-5 shrink-0 items-center justify-center rounded-[3px] bg-[#ff6600] text-xs font-bold leading-none text-white">
      Y
    </span>
  )
}

function HackerNews() {
  const { data, isLoading, isFetching, isError, refetch } = useQuery({
    queryKey: ["hacker-news", "top"],
    queryFn: () => getTopStories(5),
    staleTime: REFRESH_INTERVAL,
    refetchInterval: REFRESH_INTERVAL
  })

  return (
    <div className="w-72 rounded-2xl bg-black/20 p-3 text-gray-200 shadow-lg shadow-black/20 backdrop-blur-sm">
      <div className="mb-2 flex items-center justify-between gap-2">
        <a
          href="https://news.ycombinator.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-sm font-semibold hover:underline">
          <HackerNewsIcon />
          Hacker News
        </a>
        <IconButton
          title="Refresh"
          className="h-7 w-7 shadow-none"
          disabled={isFetching}
          onClick={() => refetch()}>
          <RefreshCw
            opacity={0.6}
            className={cn(isFetching && "animate-spin")}
          />
        </IconButton>
      </div>

      {isLoading ? (
        <ol className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <li key={i} className="h-8 animate-pulse rounded-md bg-white/10" />
          ))}
        </ol>
      ) : isError && !data ? (
        <p className="py-2 text-sm text-gray-300">Couldn't load stories.</p>
      ) : (
        <ol className="space-y-1">
          {data?.map((story, index) => {
            const domain = getDomain(story.url)
            return (
              <li key={story.id} className="flex gap-2 text-sm leading-tight">
                <span className="w-3 shrink-0 text-right text-xs leading-5 text-gray-400">
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1 py-0.5">
                  <a
                    href={story.url ?? getHackerNewsItemUrl(story.id)}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={story.title}
                    className="line-clamp-1 font-medium hover:underline">
                    {story.title}
                  </a>
                  <div className="flex gap-1 truncate text-xs text-gray-400">
                    <span>{story.score} points</span>
                    <span>·</span>
                    <a
                      href={getHackerNewsItemUrl(story.id)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-gray-200 hover:underline">
                      {story.descendants ?? 0} comments
                    </a>
                    {domain && (
                      <>
                        <span>·</span>
                        <span className="truncate">{domain}</span>
                      </>
                    )}
                  </div>
                </div>
              </li>
            )
          })}
        </ol>
      )}
    </div>
  )
}

export default HackerNews
