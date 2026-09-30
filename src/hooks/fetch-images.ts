import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useEffect } from "react"
import type { ColorId } from "unsplash-js"
import type { Basic } from "unsplash-js/dist/methods/photos/types"

import { Storage } from "@plasmohq/storage"
import { useStorage } from "@plasmohq/storage/hook"

import { BACKGROUND_SELECTION_KEY } from "~/constants"
import { useUserPreferences } from "~/context/user-preferences.context"
import { imagesQueryOptions, PAGE_SIZE, trackPhotoUsage } from "~/lib/unsplash"

/**
 * The photo currently shown, with the search position it was picked from.
 * Search results are refetched daily and Unsplash may reorder them, so without
 * this the same page/photo index could silently point to a different photo.
 * Kept in local storage: it's too large for sync storage quotas.
 */
interface BackgroundSelection {
  query: string
  color: ColorId | null
  pageIndex: number
  photoIndex: number
  photo: Basic
}

const localStorageArea = new Storage({ area: "local" })

function useFetchImages({
  term,
  color,
  enabled = true
}: {
  term?: string
  color?: ColorId
  /** False while favorites are shown, so no search requests are made */
  enabled?: boolean
}) {
  const queryClient = useQueryClient()
  const {
    preferences: { background },
    isLoading: isLoadingPreferences,
    updateBackgroundPosition
  } = useUserPreferences()
  const pageIndex = background?.pageIndex ?? 1
  const photoIndex = background?.photoIndex ?? 0

  const [selection, setSelection, { isLoading: isLoadingSelection }] =
    useStorage<BackgroundSelection | null>(
      { key: BACKGROUND_SELECTION_KEY, instance: localStorageArea },
      null
    )

  const { data, isFetching, error, refetch } = useQuery({
    ...imagesQueryOptions(term, color, pageIndex),
    // Wait for stored preferences, otherwise we'd query the defaults first
    enabled: enabled && !isLoadingPreferences && !!term && pageIndex > 0,
    refetchOnWindowFocus: false
  })

  const results = data?.response.results ?? []
  const totalPages = data?.response.total_pages ?? 0
  const hasNextInPage = photoIndex < results.length - 1
  const hasNextPage = pageIndex < totalPages

  const selectionMatches =
    !!selection &&
    selection.query === term &&
    selection.color === (color ?? null) &&
    selection.pageIndex === pageIndex &&
    selection.photoIndex === photoIndex

  const resultPhoto = results[Math.min(photoIndex, results.length - 1)]

  const isReady = !isLoadingPreferences && !isLoadingSelection
  const selectedImage: Basic | undefined = !isReady
    ? undefined
    : selectionMatches
      ? selection.photo
      : resultPhoto

  // Remember the photo picked for the current position
  useEffect(() => {
    if (!enabled || !isReady || selectionMatches || !resultPhoto) return
    setSelection({
      query: term,
      color: color ?? null,
      pageIndex,
      photoIndex,
      photo: resultPhoto
    })
    trackPhotoUsage(resultPhoto)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady, selectionMatches, resultPhoto?.id])

  // Stored position is past the end of the results (e.g. fewer results now)
  useEffect(() => {
    if (data && results.length === 0 && pageIndex > 1) {
      updateBackgroundPosition({ pageIndex: 1, photoIndex: 0 })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, pageIndex])

  // Prefetch the adjacent page when getting close to either end of this one
  useEffect(() => {
    if (!enabled || !data || !term) return
    if (photoIndex >= results.length - 2 && hasNextPage) {
      queryClient.prefetchQuery(imagesQueryOptions(term, color, pageIndex + 1))
    }
    if (photoIndex <= 1 && pageIndex > 1) {
      queryClient.prefetchQuery(imagesQueryOptions(term, color, pageIndex - 1))
    }
  }, [data, term, color, pageIndex, photoIndex])

  // The photo "next" would show, so its image can be preloaded
  const nextImage: Basic | undefined = hasNextInPage
    ? results[photoIndex + 1]
    : hasNextPage
      ? queryClient.getQueryData<typeof data>(
          imagesQueryOptions(term, color, pageIndex + 1).queryKey
        )?.response.results[0]
      : undefined

  const handleNext = () => {
    if (hasNextInPage) {
      updateBackgroundPosition({ photoIndex: photoIndex + 1 })
    } else if (hasNextPage) {
      updateBackgroundPosition({ pageIndex: pageIndex + 1, photoIndex: 0 })
    }
  }

  const handlePrevious = () => {
    if (photoIndex > 0) {
      updateBackgroundPosition({ photoIndex: photoIndex - 1 })
    } else if (pageIndex > 1) {
      // Every page before the last one is full
      updateBackgroundPosition({
        pageIndex: pageIndex - 1,
        photoIndex: PAGE_SIZE - 1
      })
    }
  }

  return {
    selectedImage,
    nextImage,
    handleNext,
    handlePrevious,
    canBack: (pageIndex > 1 || photoIndex > 0) && !isFetching,
    canNext: !!data && (hasNextInPage || hasNextPage) && !isFetching,
    isEmpty: !!data && data.response.total === 0,
    error: error as Error | null,
    refetch,
    data
  }
}

export default useFetchImages
