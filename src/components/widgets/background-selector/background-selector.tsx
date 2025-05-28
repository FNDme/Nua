import IconButton from "@/components/shared/icon-button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover"
import useFetchImages from "@/hooks/fetch-images"
import { cacheImage, getCachedImage } from "@/utils/image-cache"
import { Info, Loader2, StepBack, StepForward } from "lucide-react"
import { useEffect, useState } from "react"
import type { Basic } from "unsplash-js/dist/methods/photos/types"

import { useUserPreferences } from "~/context/user-preferences.context"

import ImageInfo from "./image-info"

async function toDataURL(url: string): Promise<string> {
  const response = await fetch(url)
  const blob = await response.blob()
  return await new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

function BackgroundSelector() {
  const {
    preferences: { background }
  } = useUserPreferences()

  const { selectedImage, handleNext, handlePrevious, canBack, canNext, data } =
    useFetchImages({
      term: background?.query,
      color: background?.color
    })

  const [currentImage, setCurrentImage] = useState<Basic | null>(null)
  const [currentImageData, setCurrentImageData] = useState<string | null>(null)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!selectedImage) return

    const loadImage = async () => {
      try {
        setError(null)

        // Try to get cached image
        const cachedImage = await getCachedImage(selectedImage.id)

        if (cachedImage) {
          // If we have a cached version, use it immediately
          setCurrentImage(selectedImage)
          setCurrentImageData(cachedImage)
          setIsTransitioning(false)
          return
        }
        setIsTransitioning(true)

        // If no cached image
        const img = new Image()
        img.crossOrigin = "anonymous"
        img.src = selectedImage.urls.full

        img.onload = async () => {
          setCurrentImage(selectedImage)
          setCurrentImageData(null)
          setIsTransitioning(false)

          // Cache the base64 data
          const base64Data = await toDataURL(selectedImage.urls.full)
          cacheImage(selectedImage.id, base64Data)
          setCurrentImageData(base64Data)
        }

        img.onerror = () => {
          setError("Failed to load image")
          setIsTransitioning(false)
        }
      } catch (err) {
        setError("Failed to load image from cache")
        setIsTransitioning(false)
      }
    }

    loadImage()
  }, [selectedImage])

  return (
    <>
      {/* Background Image */}
      <div className="fixed inset-0 z-[-1] bg-cover bg-center transition-opacity duration-500">
        {currentImageData && (
          <div
            className="h-full w-full bg-cover bg-center"
            style={{
              backgroundImage: `url(${currentImageData})`
            }}
            role="img"
            aria-label={currentImage?.alt_description ?? "Background"}
            aria-roledescription="Background"
          />
        )}
        {!currentImageData && selectedImage && (
          <div
            className="h-full w-full"
            style={{
              backgroundImage: `url(${selectedImage.urls.regular})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              filter: "blur(20px)",
              transform: "scale(1.1)"
            }}
          />
        )}
      </div>
      {/* Next and Previous Buttons */}
      <div className="relative z-10 flex w-full justify-between">
        <div className="flex flex-col-reverse items-center gap-2 sm:flex-row">
          <IconButton
            onClick={handlePrevious}
            disabled={!canBack || isTransitioning}>
            <StepBack opacity={0.6} />
          </IconButton>
          <IconButton
            onClick={handleNext}
            disabled={!canNext || isTransitioning}>
            <StepForward opacity={0.6} />
          </IconButton>
          {!!selectedImage && (
            <Popover>
              <PopoverTrigger className="inline-flex h-9 w-9 items-center justify-center gap-2 whitespace-nowrap rounded-full bg-black/20 text-sm font-medium text-gray-200 shadow-lg backdrop-blur-sm transition-colors hover:bg-black/30 hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0">
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
        </div>
      </div>
      {/* Loading State */}
      {isTransitioning && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/30">
          <Loader2 className="size-8 animate-spin" />
        </div>
      )}
      {/* Error State */}
      {error && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/30">
          <p className="text-white">{error}</p>
        </div>
      )}
    </>
  )
}

export default BackgroundSelector
