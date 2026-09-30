import { getTimeseriesForTicker, type Interval } from "@/hooks/data/twelve.data"
import type { StockInfo } from "@/hooks/data/twelve.model"
import { useQuery } from "@tanstack/react-query"
import type { Time } from "lightweight-charts"
import { ArrowDown, ArrowUp } from "lucide-react"
import { useMemo } from "react"

import PriceChart, { autoPrecision } from "~/components/shared/price-chart"
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "~/components/ui/popover"
import { SegmentedControl } from "~/components/ui/segmented-control"
import {
  useUserPreferences,
  type ChartRange,
  type ChartSize
} from "~/context/user-preferences.context"
import { MissingApiKeyError } from "~/lib/api-keys"
import { openSettings } from "~/lib/open-settings"
import { cn } from "~/lib/utils"

const DAY = 24 * 60 * 60

const RANGES: {
  value: ChartRange
  label: string
  title: string
  seconds?: number
  interval: Interval
}[] = [
  { value: "1D", label: "1D", title: "1 day", seconds: DAY, interval: "1h" },
  {
    value: "1W",
    label: "1W",
    title: "1 week",
    seconds: 7 * DAY,
    interval: "1h"
  },
  {
    value: "1M",
    label: "1M",
    title: "1 month",
    seconds: 30 * DAY,
    interval: "1h"
  },
  {
    value: "3M",
    label: "3M",
    title: "3 months",
    seconds: 90 * DAY,
    interval: "1h"
  },
  {
    value: "1Y",
    label: "1Y",
    title: "1 year",
    seconds: 365 * DAY,
    interval: "1day"
  },
  {
    value: "ALL",
    label: "All",
    title: "All available history",
    interval: "1day"
  }
]

// Hourly datetimes are "YYYY-MM-DD HH:mm:ss" in the local timezone (see the
// timezone param); daily ones are "YYYY-MM-DD". Both are read as UTC so the
// chart, which labels in UTC, shows local wall-clock times.
const toPoints = (data: StockInfo) =>
  data.values.map((value) => ({
    time: (Date.parse(
      value.datetime.length === 10
        ? `${value.datetime}T00:00:00Z`
        : `${value.datetime.replace(" ", "T")}Z`
    ) / 1000) as Time,
    value: Number(value.close),
    open: Number(value.open),
    high: Number(value.high),
    low: Number(value.low),
    close: Number(value.close)
  }))

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
  const isSmall = size.value === "sm"

  const enabled = !isLoadingPreferences && !!ticker

  // Hourly: the pill (24h change) and the short chart ranges
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["currency", ticker, "1h"],
    queryFn: () => getTimeseriesForTicker(ticker, "1h"),
    // Wait for stored preferences, otherwise we'd query the default ticker
    enabled,
    staleTime: 1000 * 60 * 15,
    refetchInterval: 1000 * 60 * 15,
    select: toPoints
  })

  // Daily: only fetched when a long range is selected
  const daily = useQuery({
    queryKey: ["currency", ticker, "1day"],
    queryFn: () => getTimeseriesForTicker(ticker, "1day"),
    enabled: enabled && range.interval === "1day",
    staleTime: 1000 * 60 * 60 * 6,
    refetchInterval: 1000 * 60 * 60 * 6,
    select: toPoints
  })

  const chartData = range.interval === "1day" ? daily.data : data

  const currentPrice = data?.[data.length - 1]?.value

  const priceChange = useMemo(() => {
    if (!data || data.length < 2) return null
    // 1h interval -> 24 data points in 1 day
    return getChange(data[Math.max(0, data.length - 25)].value, currentPrice)
  }, [data, currentPrice])

  // Change over the range selected in the chart
  const rangeChange = useMemo(() => {
    if (!chartData || chartData.length < 2) return null
    const last = chartData[chartData.length - 1]
    if (!range.seconds) return getChange(chartData[0].value, last.value)
    const from = (last.time as number) - range.seconds
    const start = chartData.find((point) => (point.time as number) >= from)
    return getChange(start?.value, last.value)
  }, [chartData, range.seconds])

  const isUp = priceChange !== null && priceChange > 0
  const precision =
    chart?.precision || (currentPrice ? autoPrecision(currentPrice) : 4)

  if (error instanceof MissingApiKeyError) {
    return (
      <button
        type="button"
        onClick={() => openSettings("keys")}
        title="Add a Twelve Data key to show prices"
        className="rounded-full bg-black/20 px-3 py-1 text-sm font-light text-gray-200 transition-all duration-300 hover:scale-105 hover:bg-black/50">
        {ticker} · Set up prices
      </button>
    )
  }

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
                <span>{currentPrice?.toFixed(precision)}</span>
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
                {rangeChange.toFixed(2)}% ·{" "}
                {range.seconds || !chartData
                  ? range.label
                  : `since ${new Date((chartData[0].time as number) * 1000).getUTCFullYear()}`}
              </span>
            )}
          </div>
          {/* Small: controls get their own full-width row so they fit */}
          <div
            className={cn(
              "flex flex-wrap items-center gap-2",
              isSmall && "w-full justify-between"
            )}>
            <SegmentedControl
              options={RANGES}
              value={range.value}
              onChange={(value) => updateChart({ range: value })}
              compact={isSmall}
            />
            <SegmentedControl
              options={SIZES}
              value={size.value}
              onChange={(value) => updateChart({ size: value })}
              compact={isSmall}
            />
          </div>
        </div>
        {chartData ? (
          <PriceChart
            data={chartData}
            height={size.height}
            rangeSeconds={range.seconds}
            type={chart?.type}
            color={chart?.color}
            precision={precision}
            grid={chart?.grid}
          />
        ) : (
          <div
            style={{ height: size.height }}
            className={cn(
              "flex items-center justify-center rounded-md bg-white/5 text-xs text-muted-foreground",
              daily.isFetching && "animate-pulse"
            )}>
            {daily.isError ? "History unavailable" : "Loading history..."}
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}

export default Currency
