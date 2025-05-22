import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useMemo } from "react"
import { createApi, type ColorId } from "unsplash-js"
import type { Basic } from "unsplash-js/dist/methods/photos/types"

import { useUserPreferences } from "~/context/user-preferences.context"

const PAGE_SIZE = 10

function useFetchImages({ term, color }: { term?: string; color?: ColorId }) {
  const queryClient = useQueryClient()
  const api = createApi({
    accessKey: process.env.PLASMO_PUBLIC_UNSPLASH_ACCESS_KEY
  })
  const {
    preferences: { background },
    updateBackgroundPosition
  } = useUserPreferences()

  const { data, isFetching } = useQuery({
    queryKey: [
      "images",
      term,
      color,
      background?.pageIndex,
      background?.photoIndex
    ],
    enabled: !!term,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      const result = await api.search.getPhotos({
        query: term,
        page: background?.pageIndex ?? 1,
        perPage: PAGE_SIZE,
        orientation: "landscape",
        color: color
      })

      // Prefetch next page if we're near the end
      if (
        background?.photoIndex >= PAGE_SIZE - 2 &&
        result.response.total_pages > background?.pageIndex
      ) {
        queryClient.prefetchQuery({
          queryKey: ["images", term, color, background?.pageIndex + 1],
          queryFn: async () => {
            return api.search.getPhotos({
              query: term,
              page: background?.pageIndex + 1,
              perPage: PAGE_SIZE,
              orientation: "landscape",
              color: color
            })
          }
        })
      }

      // Prefetch previous page if we're near the start
      if (background?.photoIndex <= 1 && background?.pageIndex > 1) {
        queryClient.prefetchQuery({
          queryKey: ["images", term, color, background?.pageIndex - 1],
          queryFn: async () => {
            return api.search.getPhotos({
              query: term,
              page: background?.pageIndex - 1,
              perPage: PAGE_SIZE,
              orientation: "landscape",
              color: color
            })
          }
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
      !isFetching
  }
}

export default useFetchImages
