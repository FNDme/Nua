import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useMemo } from "react"
import { createApi, type ColorId } from "unsplash-js"
import type { Basic } from "unsplash-js/dist/methods/photos/types"

import { useUserPreferences } from "~/context/user-preferences.context"

const PAGE_SIZE = 10

const unsplash = createApi({
  accessKey: process.env.PLASMO_PUBLIC_UNSPLASH_ACCESS_KEY
})

async function fetchPhotos(term: string, color: ColorId, page: number) {
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

function useFetchImages({ term, color }: { term?: string; color?: ColorId }) {
  const queryClient = useQueryClient()
  const {
    preferences: { background },
    updateBackgroundPosition
  } = useUserPreferences()

  const { data, isFetching } = useQuery({
    queryKey: ["images", term, color, background?.pageIndex],
    enabled: !!term && !!background?.pageIndex && background?.pageIndex > 0,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const result = await fetchPhotos(term, color, background?.pageIndex)

      // Prefetch next page if we're near the end
      if (result.response.total_pages > background?.pageIndex) {
        queryClient.prefetchQuery({
          queryKey: ["images", term, color, background?.pageIndex + 1],
          queryFn: () => fetchPhotos(term, color, background?.pageIndex + 1)
        })
      }

      // Prefetch previous page if we're near the start
      if (background?.pageIndex > 1) {
        queryClient.prefetchQuery({
          queryKey: ["images", term, color, background?.pageIndex - 1],
          queryFn: () => fetchPhotos(term, color, background?.pageIndex - 1)
        })
      }

      return result
    }
  })

  const totalPages = data?.response.total_pages ?? Infinity
  const totalResults = data?.response.total ?? Infinity

  const lastPageSize = useMemo(() => {
    return totalResults % PAGE_SIZE
  }, [totalResults])

  const handleNext = () => {
    if (
      background?.photoIndex === PAGE_SIZE - 1 &&
      background?.pageIndex < totalPages
    ) {
      const newPage = background?.pageIndex + 1
      updateBackgroundPosition({ pageIndex: newPage, photoIndex: 0 })
    } else if (
      background?.photoIndex < PAGE_SIZE - 1 &&
      background?.pageIndex < totalPages
    ) {
      updateBackgroundPosition({ photoIndex: background?.photoIndex + 1 })
    }
  }

  const handlePrevious = () => {
    if (background?.photoIndex === 0 && background?.pageIndex > 1) {
      const newPage = background?.pageIndex - 1
      updateBackgroundPosition({
        pageIndex: newPage,
        photoIndex: PAGE_SIZE - 1
      })
    } else if (background?.photoIndex > 0) {
      updateBackgroundPosition({ photoIndex: background?.photoIndex - 1 })
    }
  }

  const selectedImage = useMemo<Basic | undefined>(() => {
    if (!data || background?.photoIndex === undefined) return undefined
    return data?.response.results[background?.photoIndex]
  }, [data, background?.photoIndex])

  return {
    selectedImage,
    handleNext,
    handlePrevious,
    canBack:
      (background?.pageIndex > 1 || background?.photoIndex > 0) && !isFetching,
    canNext:
      (background?.pageIndex < totalPages ||
        background?.photoIndex < lastPageSize - 1) &&
      !isFetching,
    data
  }
}

export default useFetchImages
