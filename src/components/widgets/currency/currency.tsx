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
import { useUserPreferences } from "~/context/user-preferences.context"
import { cn } from "~/lib/utils"

function Currency() {
  const {
    preferences: { ticker }
  } = useUserPreferences()
  const { data, isLoading } = useQuery({
    queryKey: ["currency", ticker, "new"],
    queryFn: () => getTimeseriesForTicker(ticker),
    staleTime: 1000 * 60 * 15,
    refetchInterval: 1000 * 60 * 15,
    select: (data) =>
      data.values.map((value) => {
        return {
          time: (Date.parse(value.datetime) / 1000) as Time,
          value: Number(value.close)
        }
      })
  })

  const priceChange = useMemo(() => {
    if (!data || data.length < 2) return null
    const currentPrice = data[data.length - 1].value
    // 15 min interval -> 96 data points in 1 day
    const previousPrice = data[data.length - 96].value
    return ((currentPrice - previousPrice) / previousPrice) * 100
  }, [data])

  return (
    <Popover>
      <PopoverTrigger>
        <div className="overflow-hidden rounded-full bg-black/20 transition-all duration-300 hover:scale-105 hover:bg-black/50">
          <span
            className={cn(
              "flex items-center gap-2 px-2 py-1 text-sm font-light",
              priceChange && priceChange > 0
                ? "bg-green-200/20"
                : "bg-red-500/20"
            )}>
            {isLoading ? (
              <span className="animate-pulse">Loading...</span>
            ) : (
              <div className="flex items-center gap-2">
                {priceChange && priceChange > 0 ? (
                  <ArrowUp className="h-4 w-4 text-green-500" />
                ) : (
                  <ArrowDown className="h-4 w-4 text-red-500" />
                )}
                <span>
                  {Array.isArray(data) &&
                    data[data.length - 1]?.value.toFixed(4)}
                </span>
                {priceChange && (
                  <span
                    className={cn(
                      "text-xs",
                      priceChange && priceChange > 0
                        ? "text-green-500"
                        : "text-red-500"
                    )}>
                    {priceChange.toFixed(2)}%
                  </span>
                )}
              </div>
            )}
          </span>
        </div>
      </PopoverTrigger>
      <PopoverContent className="p-0">
        {data && <PriceChart data={data} />}
      </PopoverContent>
    </Popover>
  )
}

export default Currency
