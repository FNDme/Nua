import { getTimeseriesForTicker } from "@/hooks/data/twelve.data"
import { useQuery } from "@tanstack/react-query"
import type { Time } from "lightweight-charts"
import { ArrowDown, ArrowUp } from "lucide-react"
import { useMemo } from "react"

import PriceChart from "~/components/shared/price-chart"
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "~/components/ui/popover"
import {
  useUserPreferences,
  type ChartRange,
  type ChartSize
} from "~/context/user-preferences.context"
import { cn } from "~/lib/utils"

const DAY = 24 * 60 * 60

const RANGES: { value: ChartRange; label: string; seconds?: number }[] = [
  { value: "1D", label: "1D", seconds: DAY },
  { value: "1W", label: "1W", seconds: 7 * DAY },
  { value: "1M", label: "1M", seconds: 30 * DAY },
  { value: "3M", label: "3M", seconds: 90 * DAY },
  { value: "ALL", label: "All" }
]

const SIZES: {
  value: ChartSize
  label: string
  title: string
  className: string
  height: number
}[] = [
  { value: "sm", label: "S", title: "Small", className: "w-72", height: 150 },
  {
    value: "md",
    label: "M",
    title: "Medium",
    className: "w-[28rem]",
    height: 220
  },
  {
    value: "lg",
    label: "L",
    title: "Large",
    className: "w-[44rem]",
    height: 340
  }
]

function SegmentedControl<T extends string>({
  options,
  value,
  onChange
}: {
  options: { value: T; label: string; title?: string }[]
  value: T
  onChange: (value: T) => void
}) {
  return (
    <div className="flex rounded-md bg-white/5 p-0.5">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          title={option.title}
          onClick={() => onChange(option.value)}
          className={cn(
            "rounded px-2 py-0.5 text-xs text-muted-foreground transition-colors hover:text-foreground",
            option.value === value && "bg-white/10 text-foreground"
          )}>
          {option.label}
        </button>
      ))}
    </div>
  )
}

const getChange = (from?: number, to?: number) =>
  from && to ? ((to - from) / from) * 100 : null

function Currency() {
  const {
    preferences: { ticker, chart },
    isLoading: isLoadingPreferences,
    updateChart
  } = useUserPreferences()
  const range = RANGES.find((r) => r.value === chart?.range) ?? RANGES[2]
  const size = SIZES.find((s) => s.value === chart?.size) ?? SIZES[1]

  const { data, isLoading, isError } = useQuery({
    queryKey: ["currency", ticker],
    queryFn: () => getTimeseriesForTicker(ticker),
    // Wait for stored preferences, otherwise we'd query the default ticker
    enabled: !isLoadingPreferences && !!ticker,
    staleTime: 1000 * 60 * 15,
    refetchInterval: 1000 * 60 * 15,
    select: (data) =>
      data.values.map((value) => {
        return {
          time: (Date.parse(value.datetime + "Z") / 1000) as Time,
          value: Number(value.close)
        }
      })
  })

  const currentPrice = data?.[data.length - 1]?.value

  const priceChange = useMemo(() => {
    if (!data || data.length < 2) return null
    // 1h interval -> 24 data points in 1 day
    return getChange(data[Math.max(0, data.length - 25)].value, currentPrice)
  }, [data, currentPrice])

  // Change over the range selected in the chart
  const rangeChange = useMemo(() => {
    if (!data || data.length < 2) return null
    if (!range.seconds) return getChange(data[0].value, currentPrice)
    const from = (data[data.length - 1].time as number) - range.seconds
    const start = data.find((point) => (point.time as number) >= from)
    return getChange(start?.value, currentPrice)
  }, [data, range.seconds, currentPrice])

  const isUp = priceChange !== null && priceChange > 0

  return (
    <Popover>
      <PopoverTrigger>
        <div className="overflow-hidden rounded-full bg-black/20 transition-all duration-300 hover:scale-105 hover:bg-black/50">
          <span
            className={cn(
              "flex items-center gap-2 px-2 py-1 text-sm font-light",
              isUp ? "bg-green-200/20" : "bg-red-500/20"
            )}>
            {isLoading ? (
              <span className="animate-pulse">Loading...</span>
            ) : isError && !data ? (
              <span>{ticker} unavailable</span>
            ) : (
              <div className="flex items-center gap-2">
                {isUp ? (
                  <ArrowUp className="h-4 w-4 text-green-500" />
                ) : (
                  <ArrowDown className="h-4 w-4 text-red-500" />
                )}
                <span className="text-xs opacity-70">{ticker}</span>
                <span>{currentPrice?.toFixed(4)}</span>
                {priceChange !== null && (
                  <span
                    className={cn(
                      "text-xs",
                      isUp ? "text-green-500" : "text-red-500"
                    )}>
                    {priceChange.toFixed(2)}%
                  </span>
                )}
              </div>
            )}
          </span>
        </div>
      </PopoverTrigger>
      <PopoverContent
        className={cn("max-w-[calc(100vw-2rem)] p-3", size.className)}
        // Focusing the first range button would make it look selected
        onOpenAutoFocus={(e) => e.preventDefault()}>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-medium">{ticker}</span>
            {rangeChange !== null && (
              <span
                className={cn(
                  "text-xs",
                  rangeChange > 0 ? "text-green-500" : "text-red-500"
                )}>
                {rangeChange > 0 && "+"}
                {rangeChange.toFixed(2)}% · {range.label}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <SegmentedControl
              options={RANGES}
              value={range.value}
              onChange={(value) => updateChart({ range: value })}
            />
            <SegmentedControl
              options={SIZES}
              value={size.value}
              onChange={(value) => updateChart({ size: value })}
            />
          </div>
        </div>
        {data && (
          <PriceChart
            data={data}
            height={size.height}
            rangeSeconds={range.seconds}
          />
        )}
      </PopoverContent>
    </Popover>
  )
}

export default Currency
