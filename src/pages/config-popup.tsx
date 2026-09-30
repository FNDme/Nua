import debounce from "lodash.debounce"
import { Pencil, Plus } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import type { ColorId } from "unsplash-js"

import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "~/components/ui/select"
import { useUserPreferences } from "~/context/user-preferences.context"

// Radix Select items can't have an empty/undefined value
const ANY_COLOR = "any"

function ConfigPopup() {
  const { preferences, updateBackgroundTerm, updateTicker, updateQuickLinks } =
    useUserPreferences()

  const [backgroundQuery, setBackgroundQuery] = useState("")
  const [ticker, setTicker] = useState("")

  const debouncedUpdateBackground = useCallback(
    debounce((query: string) => {
      // An empty query would leave the new tab without a background
      if (query.trim()) updateBackgroundTerm({ query: query.trim() })
    }, 500),
    []
  )

  // Each change triggers a (rate limited) Twelve Data request on open tabs
  const debouncedUpdateTicker = useCallback(
    debounce((value: string) => {
      if (value.trim()) updateTicker(value.trim().toUpperCase())
    }, 800),
    []
  )

  useEffect(() => {
    setBackgroundQuery(preferences.background?.query ?? "")
  }, [preferences.background?.query])

  useEffect(() => {
    setTicker(preferences.ticker ?? "")
  }, [preferences.ticker])

  const handleBackgroundQueryChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const newQuery = e.target.value
    setBackgroundQuery(newQuery)
    debouncedUpdateBackground(newQuery)
  }

  const handleTickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTicker(e.target.value)
    debouncedUpdateTicker(e.target.value)
  }

  const handleEditQuickLinks = async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    updateQuickLinks({
      isEditing: !preferences.quickLinks.isEditing
    })
    if (tab.url !== "chrome://newtab/")
      chrome.tabs.create({ url: "chrome://newtab/" })
    window.close()
  }
  const handleAddQuickLink = async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    updateQuickLinks({ isCreating: !preferences.quickLinks.isCreating })
    if (tab.url !== "chrome://newtab/")
      chrome.tabs.create({ url: "chrome://newtab/" })
    window.close()
  }

  return (
    <div className="w-[400px] space-y-4 p-4">
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Background Settings</h2>
        <div className="space-y-2">
          <Input
            placeholder="Search query for background"
            value={backgroundQuery}
            onChange={handleBackgroundQueryChange}
          />
          <Select
            value={preferences.background?.color ?? ANY_COLOR}
            onValueChange={(value: ColorId | typeof ANY_COLOR) =>
              updateBackgroundTerm({
                color: value === ANY_COLOR ? undefined : value
              })
            }>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ANY_COLOR}>No color filter</SelectItem>
              <SelectItem value="black_and_white">Black & White</SelectItem>
              <SelectItem value="black">Black</SelectItem>
              <SelectItem value="white">White</SelectItem>
              <SelectItem value="yellow">Yellow</SelectItem>
              <SelectItem value="orange">Orange</SelectItem>
              <SelectItem value="red">Red</SelectItem>
              <SelectItem value="purple">Purple</SelectItem>
              <SelectItem value="magenta">Magenta</SelectItem>
              <SelectItem value="green">Green</SelectItem>
              <SelectItem value="teal">Teal</SelectItem>
              <SelectItem value="blue">Blue</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Ticker</h2>
        <Input
          placeholder="Ticker"
          value={ticker}
          onChange={handleTickerChange}
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Quick Links</h2>
          <div className="space-x-2">
            {preferences.quickLinks.links.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleEditQuickLinks}>
                <Pencil className="mr-2 h-4 w-4" />
                {preferences.quickLinks.isEditing ? "Done" : "Edit"}
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                handleAddQuickLink()
              }}>
              <Plus className="mr-2 h-4 w-4" />
              Add
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ConfigPopup
