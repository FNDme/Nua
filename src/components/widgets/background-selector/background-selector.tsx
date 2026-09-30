import IconButton from "@/components/shared/icon-button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover"
import { useBackgroundFavorites } from "@/hooks/background-favorites"
import useFetchImages from "@/hooks/fetch-images"
import {
  Heart,
  Info,
  Loader2,
  RotateCw,
  StepBack,
  StepForward,
  TriangleAlert
} from "lucide-react"
import { useEffect, useRef, useState } from "react"

import { useUserPreferences } from "~/context/user-preferences.context"
import { MissingApiKeyError } from "~/lib/api-keys"
import { openSettings } from "~/lib/open-settings"
import { cn } from "~/lib/utils"

import ImageInfo from "./image-info"
import { loadBackgroundImage, preloadBackgroundImage } from "./load-image"

interface Layer {
  id: string
  url: string
  alt: string
}

function BackgroundSelector() {
  const {
    preferences: { background },
    updateBackgroundFavorites
  } = useUserPreferences()

  const { favorites, isFavorite, toggleFavorite } = useBackgroundFavorites()
  // Favorites mode with nothing saved falls back to search results
  const showFavorites = background?.mode === "favorites" && favorites.length > 0

  const search = useFetchImages({
    term: background?.query,
    color: background?.color,
    enabled: !showFavorites
  })

  // Favorites wrap around in both directions
  const favoriteIndex = showFavorites
    ? Math.min(background?.favoriteIndex ?? 0, favorites.length - 1)
    : 0
  const goToFavorite = (index: number) =>
    updateBackgroundFavorites({
      favoriteIndex: (index + favorites.length) % favorites.length
    })

  const {
    selectedImage,
    nextImage,
    handleNext,
    handlePrevious,
    canBack,
    canNext,
    isEmpty,
    error: searchError,
    refetch
  } = showFavorites
    ? {
        selectedImage: favorites[favoriteIndex],
        nextImage: favorites[(favoriteIndex + 1) % favorites.length],
        handleNext: () => goToFavorite(favoriteIndex + 1),
        handlePrevious: () => goToFavorite(favoriteIndex - 1),
        canBack: favorites.length > 1,
        canNext: favorites.length > 1,
        isEmpty: false,
        error: null,
        refetch: search.refetch
      }
    : search
  const favorite = isFavorite(selectedImage?.id)

  // The previous image stays underneath while the new one fades in
  const [layers, setLayers] = useState<Layer[]>([])
  const [isLoadingImage, setIsLoadingImage] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const displayedId = useRef<string | null>(null)
  const objectUrls = useRef(new Set<string>())

  const currentLayer = layers[layers.length - 1]

  useEffect(() => {
    if (!selectedImage || displayedId.current === selectedImage.id) return

    // Ignore the result if the selection changes before it finishes loading
    let cancelled = false
    setImageError(false)
    setIsLoadingImage(true)

    const load = async () => {
      const blob = await loadBackgroundImage(selectedImage)
      if (cancelled) return

      const url = URL.createObjectURL(blob)
      objectUrls.current.add(url)
      // Decode before showing it so the fade-in doesn't start on a blank frame
      const img = new Image()
      img.src = url
      await img.decode().catch(() => {})
      if (cancelled) return

      displayedId.current = selectedImage.id
      setLayers((prev) => [
        ...prev.slice(-1),
        {
          id: selectedImage.id,
          url,
          alt: selectedImage.alt_description ?? "Background"
        }
      ])
    }

    load()
      .catch(() => !cancelled && setImageError(true))
      .finally(() => !cancelled && setIsLoadingImage(false))

    return () => {
      cancelled = true
    }
  }, [selectedImage?.id, retryCount])

  // Release object URLs of images no longer on screen
  useEffect(() => {
    const live = new Set(layers.map((layer) => layer.url))
    objectUrls.current.forEach((url) => {
      if (live.has(url)) return
      URL.revokeObjectURL(url)
      objectUrls.current.delete(url)
    })
  }, [layers])

  useEffect(() => {
    const urls = objectUrls.current
    return () => urls.forEach((url) => URL.revokeObjectURL(url))
  }, [])

  // Once the current image is shown, fetch the next one in the background
  useEffect(() => {
    if (!nextImage || !currentLayer || isLoadingImage) return
    const timeout = setTimeout(() => preloadBackgroundImage(nextImage), 1000)
    return () => clearTimeout(timeout)
  }, [nextImage?.id, currentLayer?.id, isLoadingImage])

  const status: {
    message: string
    retry?: () => void
    setup?: boolean
  } | null =
    searchError instanceof MissingApiKeyError
      ? { message: "Add your Unsplash key for photos", setup: true }
      : searchError
        ? { message: "Couldn't load images", retry: () => refetch() }
        : isEmpty
          ? { message: `No images for "${background?.query}"` }
          : imageError
            ? {
                message: "Couldn't load image",
                retry: () => setRetryCount((c) => c + 1)
              }
            : null

  return (
    <>
      {/* Background Image */}
      <div
        className="fixed inset-0 z-[-1] bg-zinc-900"
        style={{ backgroundColor: selectedImage?.color ?? undefined }}>
        {/* Blurred low-res preview until the first image is ready */}
        {!currentLayer && selectedImage && (
          <img
            src={selectedImage.urls.small}
            alt=""
            aria-hidden
            className="h-full w-full scale-110 object-cover blur-2xl"
          />
        )}
        {layers.map((layer, index) => (
          <img
            key={layer.url}
            src={layer.url}
            alt={layer.alt}
            aria-roledescription="Background"
            className={cn(
              "absolute inset-0 h-full w-full object-cover",
              // Only animate replacements, the first image shows instantly
              index > 0 && "duration-700 animate-in fade-in"
            )}
          />
        ))}
      </div>
      {/* Next and Previous Buttons */}
      <div className="relative z-20 flex w-full justify-between">
        <div className="flex flex-col-reverse items-center gap-2 sm:flex-row">
          <IconButton
            title={showFavorites ? "Previous favorite" : "Previous background"}
            onClick={handlePrevious}
            disabled={!canBack || isLoadingImage}>
            <StepBack opacity={0.6} />
          </IconButton>
          <IconButton
            title={showFavorites ? "Next favorite" : "Next background"}
            onClick={handleNext}
            disabled={!canNext || isLoadingImage}>
            {isLoadingImage ? (
              <Loader2 className="animate-spin" opacity={0.6} />
            ) : (
              <StepForward opacity={0.6} />
            )}
          </IconButton>
          {!!selectedImage && (
            <IconButton
              title={favorite ? "Remove from favorites" : "Add to favorites"}
              aria-pressed={favorite}
              onClick={() => toggleFavorite(selectedImage)}>
              <Heart
                opacity={favorite ? 1 : 0.6}
                className={cn(favorite && "fill-rose-500 text-rose-500")}
              />
            </IconButton>
          )}
          {!!selectedImage && (
            <Popover>
              <PopoverTrigger
                title="Image info"
                className="inline-flex h-9 w-9 items-center justify-center gap-2 whitespace-nowrap rounded-full bg-black/20 text-sm font-medium text-gray-200 shadow-lg backdrop-blur-sm transition-colors hover:bg-black/30 hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0">
                <Info opacity={0.6} />
              </PopoverTrigger>
              {/* Image info and author */}
              <PopoverContent
                className="w-80 rounded-xl p-2 shadow-xl"
                side="right"
                align="start">
                <ImageInfo currentImage={selectedImage} />
              </PopoverContent>
            </Popover>
          )}
          {status && (
            <div className="flex h-9 items-center gap-2 rounded-full bg-black/20 pl-3 pr-1 text-sm text-gray-200 shadow-lg backdrop-blur-sm">
              <TriangleAlert className="size-4 shrink-0 text-amber-300" />
              <span className="whitespace-nowrap">{status.message}</span>
              {status.setup ? (
                <button
                  type="button"
                  onClick={() => openSettings("keys")}
                  className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium hover:bg-white/25">
                  Set up
                </button>
              ) : status.retry ? (
                <IconButton
                  title="Retry"
                  className="h-7 w-7 shadow-none"
                  onClick={status.retry}>
                  <RotateCw />
                </IconButton>
              ) : (
                <span className="w-2" />
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default BackgroundSelector
