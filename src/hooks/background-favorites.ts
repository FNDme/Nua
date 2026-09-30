import type { Basic } from "unsplash-js/dist/methods/photos/types"

import { Storage } from "@plasmohq/storage"
import { useStorage } from "@plasmohq/storage/hook"

import { BACKGROUND_FAVORITES_KEY } from "~/constants"

// Whole photo objects (a few KB each) so favorites show without API calls.
// Local area: sync storage caps items at 8KB.
const localStorageArea = new Storage({ area: "local" })

/** Saved background photos, newest first. Shared by the new tab and the popup. */
export function useBackgroundFavorites() {
  const [favorites, setFavorites, { isLoading }] = useStorage<Basic[]>(
    { key: BACKGROUND_FAVORITES_KEY, instance: localStorageArea },
    (v) => v ?? []
  )

  const isFavorite = (id?: string) =>
    !!id && favorites.some((photo) => photo.id === id)

  const toggleFavorite = (photo: Basic) =>
    setFavorites((prev = []) =>
      prev.some((p) => p.id === photo.id)
        ? prev.filter((p) => p.id !== photo.id)
        : [photo, ...prev]
    )

  const removeFavorite = (id: string) =>
    setFavorites((prev = []) => prev.filter((p) => p.id !== id))

  return { favorites, isLoading, isFavorite, toggleFavorite, removeFavorite }
}
