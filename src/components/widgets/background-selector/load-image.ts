import type { Basic } from "unsplash-js/dist/methods/photos/types"

import { getBackgroundUrl, getBackgroundWidth } from "~/lib/unsplash"
import { cacheImage, getCachedImage, hasCachedImage } from "~/utils/image-cache"

const getCacheKey = (photo: Basic, width: number) => `${photo.id}@${width}`

// Dedupes a preload and a display request for the same image
const pending = new Map<string, Promise<Blob>>()

async function downloadImage(photo: Basic, width: number): Promise<Blob> {
  const key = getCacheKey(photo, width)
  if (!pending.has(key)) {
    const request = (async () => {
      const response = await fetch(getBackgroundUrl(photo, width))
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const blob = await response.blob()
      // A failing cache (e.g. private mode quota) shouldn't block display
      await cacheImage(key, blob).catch(() => {})
      return blob
    })().finally(() => pending.delete(key))
    pending.set(key, request)
  }
  return pending.get(key)
}

/** Returns the background image for a photo, from cache when possible. */
export async function loadBackgroundImage(photo: Basic): Promise<Blob> {
  const width = getBackgroundWidth()
  const cached = await getCachedImage(getCacheKey(photo, width)).catch(
    () => undefined
  )
  return cached ?? downloadImage(photo, width)
}

/** Warms the cache so navigating to this photo is instant. */
export async function preloadBackgroundImage(photo: Basic): Promise<void> {
  const width = getBackgroundWidth()
  if (await hasCachedImage(getCacheKey(photo, width)).catch(() => false)) return
  await downloadImage(photo, width).catch(() => {})
}
