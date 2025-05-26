import { useQuery } from "@tanstack/react-query"
import { createApi } from "unsplash-js"
import type { Basic } from "unsplash-js/dist/methods/photos/types"

function ImageInfo({ currentImage }: { currentImage: Basic }) {
  const api = createApi({
    accessKey: process.env.PLASMO_PUBLIC_UNSPLASH_ACCESS_KEY
  })
  const { data: fullInfo } = useQuery({
    queryKey: ["image-info", currentImage.id],
    queryFn: () => api.photos.get({ photoId: currentImage.id }),
    select: (data) => data.response
  })

  return (
    <div className="max-h-[90vh] space-y-4 overflow-y-auto p-3">
      <div className="space-y-2">
        {currentImage?.urls?.small && (
          <img
            src={currentImage.urls.small}
            alt={currentImage?.alt_description || "Image thumbnail"}
            className="mb-2 h-32 w-full rounded-lg border-zinc-800 object-cover shadow"
          />
        )}
        {currentImage?.description && (
          <h3 className="text-lg font-semibold text-white">
            {currentImage.description}
          </h3>
        )}
        {currentImage?.alt_description && (
          <p className="text-base text-muted-foreground">
            {currentImage.alt_description}
          </p>
        )}
        <div className="mt-1 flex items-center gap-2">
          <a
            href={`${currentImage?.links.html}?utm_source=nua&utm_medium=referral`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-base text-blue-400 hover:underline">
            View on Unsplash
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="ml-1">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </a>
        </div>
      </div>
      {fullInfo && (
        <>
          <div className="my-4 border-t border-zinc-700" />
          <div className="space-y-3">
            {fullInfo.exif && (
              <div className="space-y-1">
                <h4 className="font-semibold text-white">Camera Information</h4>
                <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                  {fullInfo.exif.make && (
                    <div>
                      <span className="font-medium">Make:</span>{" "}
                      {fullInfo.exif.make}
                    </div>
                  )}
                  {fullInfo.exif.model && (
                    <div>
                      <span className="font-medium">Model:</span>{" "}
                      {fullInfo.exif.model}
                    </div>
                  )}
                  {fullInfo.exif.exposure_time && (
                    <div>
                      <span className="font-medium">Exposure:</span>{" "}
                      {fullInfo.exif.exposure_time}s
                    </div>
                  )}
                  {fullInfo.exif.aperture && (
                    <div>
                      <span className="font-medium">Aperture:</span> f/
                      {fullInfo.exif.aperture}
                    </div>
                  )}
                  {fullInfo.exif.focal_length && (
                    <div>
                      <span className="font-medium">Focal Length:</span>{" "}
                      {fullInfo.exif.focal_length}mm
                    </div>
                  )}
                  {fullInfo.exif.iso && (
                    <div>
                      <span className="font-medium">ISO:</span>{" "}
                      {fullInfo.exif.iso}
                    </div>
                  )}
                </div>
              </div>
            )}

            {fullInfo.location && (
              <div className="space-y-1">
                <h4 className="font-semibold text-white">Location</h4>
                <div className="text-sm text-muted-foreground">
                  {fullInfo.location.name && (
                    <div>{fullInfo.location.name}</div>
                  )}
                  {fullInfo.location.city && (
                    <div>{fullInfo.location.city}</div>
                  )}
                  {fullInfo.location.country && (
                    <div>{fullInfo.location.country}</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </>
      )}
      <div className="my-4 border-t border-zinc-700" />
      <div className="flex items-center justify-end gap-3 text-right">
        <div>
          <a
            href={`https://unsplash.com/@${currentImage?.user.username}`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-white hover:underline">
            {currentImage?.user.name}
            {currentImage?.user.username && (
              <p className="text-xs text-muted-foreground">
                @{currentImage?.user.username}
              </p>
            )}
          </a>
        </div>
        <img
          src={currentImage?.user.profile_image.medium}
          alt={`${currentImage?.user.name}'s profile`}
          className="h-10 w-10 rounded-full"
        />
      </div>
    </div>
  )
}

export default ImageInfo
