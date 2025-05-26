import IconButton from "@/components/shared/icon-button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover"
import useFetchImages from "@/hooks/fetch-images"
import { Info, Loader2, StepBack, StepForward } from "lucide-react"
import { useEffect, useState } from "react"
import type { Basic } from "unsplash-js/dist/methods/photos/types"

import { useUserPreferences } from "~/context/user-preferences.context"

import ImageInfo from "./image-info"

function BackgroundSelector() {
  const {
    preferences: { background }
  } = useUserPreferences()

  const { selectedImage, handleNext, handlePrevious, canBack, canNext } =
    useFetchImages({
      term: background?.query,
      color: background?.color
    })

  const [currentImage, setCurrentImage] = useState<Basic | null>(null)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (selectedImage !== currentImage) {
      console.log("selectedImage", selectedImage, background?.photoIndex)
      setIsTransitioning(true)
      setError(null)

      const img = new Image()
      img.src = selectedImage?.urls.full

      img.onload = () => {
        setCurrentImage(selectedImage)
        setIsTransitioning(false)
      }

      img.onerror = () => {
        setError("Failed to load image")
        setIsTransitioning(false)
      }
    }
  }, [selectedImage])

  return (
    <>
      {/* Background Image */}
      <div className="fixed inset-0 z-[-1] bg-cover bg-center transition-opacity duration-500">
        {currentImage && (
          <img
            src={currentImage?.urls.full}
            alt={currentImage?.alt_description ?? "Background"}
            aria-hidden
            aria-label={currentImage?.alt_description ?? "Background"}
            aria-roledescription="Background"
            className="h-full w-full object-cover"
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
          <Popover>
            <PopoverTrigger className="inline-flex h-9 w-9 items-center justify-center gap-2 whitespace-nowrap rounded-full bg-black/20 text-sm font-medium text-gray-200 shadow-lg backdrop-blur-sm transition-colors hover:bg-black/30 hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0">
              <Info opacity={0.6} />
            </PopoverTrigger>
            {/* Image info and author */}
            <PopoverContent
              className="w-80 rounded-xl p-2 shadow-xl"
              side="right"
              align="start">
              <ImageInfo currentImage={currentImage} />
            </PopoverContent>
          </Popover>
        </div>
      </div>
      {/* Loading and Error States */}
      {(!currentImage || isTransitioning) && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/30">
          <Loader2 className="h-8 w-8 animate-spin text-white" />
        </div>
      )}
      {error && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/30">
          <p className="text-white">{error}</p>
        </div>
      )}
    </>
  )
}

export default BackgroundSelector
