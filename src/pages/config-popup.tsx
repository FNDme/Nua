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

function ConfigPopup() {
  const { preferences, updateBackgroundTerm, updateTicker, updateQuickLinks } =
    useUserPreferences()

  const [backgroundQuery, setBackgroundQuery] = useState("")

  const debouncedUpdateBackground = useCallback(
    debounce((query: string) => {
      updateBackgroundTerm({ query })
    }, 500),
    []
  )

  useEffect(() => {
    setBackgroundQuery(preferences.background?.query ?? "")
  }, [preferences.background?.query])

  const handleBackgroundQueryChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const newQuery = e.target.value
    setBackgroundQuery(newQuery)
    debouncedUpdateBackground(newQuery)
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
            value={preferences.background?.color}
            onValueChange={(value: ColorId) =>
              updateBackgroundTerm({ color: value })
            }>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={undefined}>No color filter</SelectItem>
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
          value={preferences.ticker}
          onChange={(e) => updateTicker(e.target.value)}
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
