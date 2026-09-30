import axios from "axios"

import { readApiKey } from "~/lib/api-keys"

import { type StockInfo, type TwelveDataError } from "./twelve.model"

interface CachedItem<T> {
  value: T
  expiration: number
}

export type Interval = "1h" | "1day"

const CACHE_DURATION: Record<Interval, number> = {
  "1h": 15 * 60 * 1000, // 15 minutes
  "1day": 6 * 60 * 60 * 1000 // 6 hours
}

const DAY_MS = 24 * 60 * 60 * 1000

// Twelve Data returns at most 5000 points per request. Hourly data covers the
// short ranges (100 days is ~2400 points for forex); the long ranges use the
// latest 5000 daily points, which is the full history for most tickers.
const INTERVAL_PARAMS: Record<Interval, () => Record<string, string | number>> =
  {
    "1h": () => ({
      start_date: new Date(Date.now() - 100 * DAY_MS)
        .toISOString()
        .split("T")[0]
    }),
    "1day": () => ({ outputsize: 5000 })
  }

const getCache = <T>(key: string): CachedItem<T> | null => {
  const item = localStorage.getItem(key)
  return item ? JSON.parse(item) : null
}

const setCache = <T>(key: string, value: T, expiration: number) => {
  const item = {
    value,
    expiration
  }
  localStorage.setItem(key, JSON.stringify(item))
}

// dedupes when second same requests come in before the first one resolves
const promiseCache: Record<string, Promise<any>> = {}

export const getTimeseriesForTicker = async (
  ticker: string,
  interval: Interval = "1h",
  useCache = true
): Promise<StockInfo> => {
  const now = Date.now()
  const key = `${ticker}:${interval}`

  if (promiseCache[key] != null) {
    return promiseCache[key]
  }

  if (useCache) {
    const cachedItem = getCache<StockInfo>(key)
    if (cachedItem && cachedItem.expiration > now) {
      return cachedItem.value
    }
  }

  promiseCache[key] = (async () => {
    try {
      const apiKey = await readApiKey("twelveData")
      const response = await axios.get(
        "https://api.twelvedata.com/time_series",
        {
          params: {
            symbol: ticker,
            ...INTERVAL_PARAMS[interval](),
            interval,
            apikey: apiKey,
            order: "ASC",
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
          }
        }
      )
      if (response.status !== axios.HttpStatusCode.Ok) {
        throw new Error(`HTTP error status: ${response.status}`)
      }

      const data = response.data

      // usually because of hitting max API limits per minute
      if ((data as TwelveDataError).status === "error") {
        throw new Error(`${JSON.stringify(data)}`)
      }

      setCache(key, data, now + CACHE_DURATION[interval])

      delete promiseCache[key]

      return data
    } catch (error) {
      delete promiseCache[key]

      throw error
    }
  })()

  return promiseCache[key]
}
