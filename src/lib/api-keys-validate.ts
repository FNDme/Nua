import type { ApiService } from "~/lib/api-keys"

export interface KeyCheck {
  ok: boolean
  /** Why it failed: the service rejected it, or it couldn't be checked */
  reason?: "invalid" | "network"
  detail?: string
}

/**
 * Checks a key with one cheap request, before it's saved.
 * Unsplash: 1 photo from the editorial feed. Twelve Data: the usage endpoint
 * (costs no credits).
 */
export async function checkApiKey(
  service: ApiService,
  key: string
): Promise<KeyCheck> {
  try {
    if (service === "unsplash") {
      const response = await fetch(
        "https://api.unsplash.com/photos?per_page=1",
        {
          headers: {
            Authorization: `Client-ID ${key}`,
            "Accept-Version": "v1"
          }
        }
      )
      if (response.status === 401 || response.status === 403) {
        return { ok: false, reason: "invalid" }
      }
      if (!response.ok) {
        return {
          ok: false,
          reason: "network",
          detail: `HTTP ${response.status}`
        }
      }
      const remaining = response.headers.get("x-ratelimit-remaining")
      const limit = response.headers.get("x-ratelimit-limit")
      return {
        ok: true,
        detail:
          remaining && limit
            ? `${remaining}/${limit} requests left this hour`
            : undefined
      }
    }

    const response = await fetch(
      `https://api.twelvedata.com/api_usage?apikey=${encodeURIComponent(key)}`
    )
    const data = await response.json()
    if (data?.status === "error" || data?.code >= 400) {
      return data.code === 401 || data.code === 403
        ? { ok: false, reason: "invalid" }
        : { ok: false, reason: "network", detail: data.message }
    }
    return {
      ok: true,
      detail:
        typeof data?.daily_usage === "number" && data?.plan_daily_limit
          ? `${data.daily_usage}/${data.plan_daily_limit} credits used today`
          : undefined
    }
  } catch {
    return { ok: false, reason: "network" }
  }
}
