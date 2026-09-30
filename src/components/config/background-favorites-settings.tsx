import { Heart, X } from "lucide-react"

import { useUserPreferences } from "~/context/user-preferences.context"
import { useBackgroundFavorites } from "~/hooks/background-favorites"
import { cn } from "~/lib/utils"

/** Background source switch plus the saved favorites grid (in the popup) */
function BackgroundFavoritesSettings() {
  const { preferences, updateBackgroundFavorites } = useUserPreferences()
  const { favorites, removeFavorite } = useBackgroundFavorites()
  const showingFavorites =
    preferences.background?.mode === "favorites" && favorites.length > 0
  const current = showingFavorites
    ? Math.min(preferences.background?.favoriteIndex ?? 0, favorites.length - 1)
    : -1

  const modes = [
    { value: "search", label: "Search results" },
    { value: "favorites", label: `Favorites (${favorites.length})` }
  ] as const

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm text-muted-foreground">Show</span>
        <div className="flex rounded-md bg-white/5 p-0.5">
          {modes.map((mode) => {
            const active =
              mode.value === "favorites" ? showingFavorites : !showingFavorites
            return (
              <button
                key={mode.value}
                type="button"
                disabled={mode.value === "favorites" && favorites.length === 0}
                onClick={() => updateBackgroundFavorites({ mode: mode.value })}
                className={cn(
                  "rounded px-2 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground disabled:pointer-events-none disabled:opacity-40",
                  active && "bg-white/10 text-foreground"
                )}>
                {mode.label}
              </button>
            )
          })}
        </div>
      </div>

      {favorites.length === 0 ? (
        <p className="flex items-center gap-1 text-xs text-muted-foreground">
          Save backgrounds with the
          <Heart className="h-3 w-3" aria-label="heart" />
          button on the new tab.
        </p>
      ) : (
        <ul className="grid max-h-40 grid-cols-4 gap-2 overflow-y-auto pr-1">
          {favorites.map((photo, index) => (
            <li key={photo.id} className="group relative">
              <button
                type="button"
                title={
                  photo.alt_description ??
                  `Photo by ${photo.user?.name ?? "Unsplash"}`
                }
                onClick={() =>
                  updateBackgroundFavorites({
                    mode: "favorites",
                    favoriteIndex: index
                  })
                }
                className={cn(
                  "block aspect-video w-full overflow-hidden rounded-md ring-offset-2 ring-offset-[#262626]",
                  index === current && "ring-2 ring-rose-400"
                )}>
                <img
                  src={photo.urls.thumb}
                  alt=""
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </button>
              <button
                type="button"
                aria-label="Remove from favorites"
                title="Remove from favorites"
                onClick={() => removeFavorite(photo.id)}
                className="absolute right-0.5 top-0.5 rounded-full bg-black/60 p-0.5 text-white opacity-0 hover:bg-black/80 focus:opacity-100 group-hover:opacity-100">
                <X className="h-3 w-3" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default BackgroundFavoritesSettings
