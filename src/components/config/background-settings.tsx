import debounce from "lodash.debounce"
import { useCallback, useEffect, useState } from "react"
import type { ColorId } from "unsplash-js"

import { Input } from "~/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "~/components/ui/select"
import { useUserPreferences } from "~/context/user-preferences.context"

import BackgroundFavoritesSettings from "./background-favorites-settings"
import { Row, Section } from "./settings-ui"

// Radix Select items can't have an empty/undefined value
const ANY_COLOR = "any"

const COLORS: { value: ColorId; label: string }[] = [
  { value: "black_and_white", label: "Black & White" },
  { value: "black", label: "Black" },
  { value: "white", label: "White" },
  { value: "yellow", label: "Yellow" },
  { value: "orange", label: "Orange" },
  { value: "red", label: "Red" },
  { value: "purple", label: "Purple" },
  { value: "magenta", label: "Magenta" },
  { value: "green", label: "Green" },
  { value: "teal", label: "Teal" },
  { value: "blue", label: "Blue" }
]

function BackgroundSettings() {
  const { preferences, updateBackgroundTerm } = useUserPreferences()
  const [query, setQuery] = useState("")

  useEffect(() => {
    setQuery(preferences.background?.query ?? "")
  }, [preferences.background?.query])

  const saveQuery = useCallback(
    debounce((value: string) => {
      // An empty query would leave the new tab without a background
      if (value.trim()) updateBackgroundTerm({ query: value.trim() })
    }, 500),
    []
  )

  return (
    <div className="space-y-4">
      <Section
        title="Photos"
        description="Unsplash photos matching a search. Changing it switches back from favorites.">
        <Input
          placeholder="mountains, city at night, forest…"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            saveQuery(e.target.value)
          }}
          aria-label="Background search"
        />
        <Row label="Color" htmlFor="background-color">
          <Select
            value={preferences.background?.color ?? ANY_COLOR}
            onValueChange={(value: ColorId | typeof ANY_COLOR) =>
              updateBackgroundTerm({
                color: value === ANY_COLOR ? undefined : value
              })
            }>
            <SelectTrigger id="background-color" className="h-8 w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ANY_COLOR}>Any color</SelectItem>
              {COLORS.map((color) => (
                <SelectItem key={color.value} value={color.value}>
                  {color.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Row>
      </Section>

      <Section
        title="Favorites"
        description="Show only photos you saved with the ♥ button.">
        <BackgroundFavoritesSettings />
      </Section>
    </div>
  )
}

export default BackgroundSettings
