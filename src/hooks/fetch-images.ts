import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useMemo } from "react"
import type { ColorId } from "unsplash-js"
import type { Basic } from "unsplash-js/dist/methods/photos/types"

import { useUserPreferences } from "~/context/user-preferences.context"

const PAGE_SIZE = 10

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
      const result = await chrome.runtime.sendMessage({
        type: "UNSPLASH_API_REQUEST",
        payload: {
          method: "getPhotos",
          params: {
            query: term,
            page: background?.pageIndex,
            perPage: PAGE_SIZE,
            orientation: "landscape",
            color: color
          }
        }
      })

      if (result.error) {
        throw new Error(result.error)
      }

      // Prefetch next page if we're near the end
      if (result.data.response.total_pages > background?.pageIndex) {
        queryClient.prefetchQuery({
          queryKey: ["images", term, color, background?.pageIndex + 1],
          queryFn: async () => {
            const nextPageResult = await chrome.runtime.sendMessage({
              type: "UNSPLASH_API_REQUEST",
              payload: {
                method: "getPhotos",
                params: {
                  query: term,
                  page: background?.pageIndex + 1,
                  perPage: PAGE_SIZE,
                  orientation: "landscape",
                  color: color
                }
              }
            })
            if (nextPageResult.error) {
              throw new Error(nextPageResult.error)
            }
            return nextPageResult.data
          }
        })
      }

      // Prefetch previous page if we're near the start
      if (background?.pageIndex > 1) {
        queryClient.prefetchQuery({
          queryKey: ["images", term, color, background?.pageIndex - 1],
          queryFn: async () => {
            const prevPageResult = await chrome.runtime.sendMessage({
              type: "UNSPLASH_API_REQUEST",
              payload: {
                method: "getPhotos",
                params: {
                  query: term,
                  page: background?.pageIndex - 1,
                  perPage: PAGE_SIZE,
                  orientation: "landscape",
                  color: color
                }
              }
            })
            if (prevPageResult.error) {
              throw new Error(prevPageResult.error)
            }
            return prevPageResult.data
          }
        })
      }

      return result.data
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
