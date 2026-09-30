import { createApi, type ColorId } from "unsplash-js"
import type { Basic } from "unsplash-js/dist/methods/photos/types"

export const PAGE_SIZE = 10

// Widest image we ever request, regardless of the screen (4K)
const MAX_IMAGE_WIDTH = 3840

export const unsplash = createApi({
  accessKey: process.env.PLASMO_PUBLIC_UNSPLASH_ACCESS_KEY
})

export async function fetchPhotos(term: string, color: ColorId, page: number) {
  const result = await unsplash.search.getPhotos({
    query: term,
    page,
    perPage: PAGE_SIZE,
    orientation: "landscape",
    color
  })

  if (result.type === "error") {
    throw new Error(result.errors.join(", "))
  }

  return result
}

export const imagesQueryOptions = (
  term: string,
  color: ColorId | undefined,
  page: number
) => ({
  queryKey: ["images", term, color, page],
  queryFn: () => fetchPhotos(term, color, page)
})

/**
 * Width in physical pixels needed to cover the screen. `urls.full` is the
 * original resolution (often 5-20MB), so we ask Unsplash (imgix) for a resized
 * webp instead.
 */
export function getBackgroundWidth() {
  const width = window.screen.width * (window.devicePixelRatio || 1)
  // Round up to the next 256px so small DPI/zoom changes reuse the cache
  return Math.min(Math.ceil(width / 256) * 256, MAX_IMAGE_WIDTH)
}

export function getBackgroundUrl(photo: Basic, width = getBackgroundWidth()) {
  const url = new URL(photo.urls.raw)
  url.searchParams.set("w", String(width))
  url.searchParams.set("q", "80")
  url.searchParams.set("fm", "webp")
  url.searchParams.set("fit", "max")
  return url.toString()
}

/**
 * Unsplash API guidelines require hitting the download endpoint when a photo
 * is "used" (set as a background counts).
 * https://help.unsplash.com/en/articles/2511258-guideline-triggering-a-download
 */
export function trackPhotoUsage(photo: Basic) {
  unsplash.photos
    .trackDownload({ downloadLocation: photo.links.download_location })
    .catch(() => {})
}
