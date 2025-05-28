import axios from "axios"

import { type StockInfo, type TwelveDataError } from "./twelve.model"

interface CachedItem<T> {
  value: T
  expiration: number
}

const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

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
  useCache = true
): Promise<StockInfo> => {
  const now = Date.now()

  if (promiseCache[ticker] != null) {
    return promiseCache[ticker]
  }

  if (useCache) {
    const cachedItem = getCache<StockInfo>(ticker)
    if (cachedItem && cachedItem.expiration > now) {
      return cachedItem.value
    }
  }

  promiseCache[ticker] = (async () => {
    const apiKey = process.env.PLASMO_PUBLIC_TWELVE_DATA_API_KEY

    try {
      const response = await axios.get(
        "https://api.twelvedata.com/time_series",
        {
          params: {
            symbol: ticker,
            start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
              .toISOString()
              .split("T")[0],
            interval: "15min",
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

      setCache(ticker, data, now + CACHE_DURATION)

      delete promiseCache[ticker]

      return data
    } catch (error) {
      delete promiseCache[ticker]

      throw error
    }
  })()

  return promiseCache[ticker]
}
