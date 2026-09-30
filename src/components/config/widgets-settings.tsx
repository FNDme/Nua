import { Pencil, Plus } from "lucide-react"

import { Button } from "~/components/ui/button"
import {
  useUserPreferences,
  type WidgetId
} from "~/context/user-preferences.context"

import { Row, Section, Switch } from "./settings-ui"

const WIDGETS: { id: WidgetId; name: string; hint: string }[] = [
  {
    id: "background",
    name: "Background photo",
    hint: "Unsplash photo; off shows a gradient"
  },
  { id: "search", name: "Search bar", hint: "Uses your default search engine" },
  { id: "clock", name: "Clock", hint: "Time and date, bottom right" },
  {
    id: "workTimer",
    name: "Work day bar",
    hint: "Progress through your working hours"
  },
  { id: "pomodoro", name: "Pomodoro", hint: "Focus timer with notifications" },
  { id: "currency", name: "Currency", hint: "Ticker price and chart" },
  { id: "news", name: "News", hint: "Hacker News and your feeds, bottom left" },
  { id: "notes", name: "Notes & to-do", hint: "Scratchpad and task list" },
  { id: "quickLinks", name: "Quick links", hint: "Shortcuts, top right" }
]

const NEW_TAB_URL = "chrome://newtab/"

function WidgetsSettings() {
  const { preferences, updateWidgets, updateQuickLinks } = useUserPreferences()
  const on = preferences.widgets
  const enabledCount = WIDGETS.filter((w) => on[w.id]).length

  // Quick links are edited on the new tab itself. Opening the popup grants
  // activeTab, which usually exposes the current tab's URL; if it doesn't,
  // a fresh new tab is opened instead (no "tabs" permission needed).
  const editQuickLinks = async (change: "isEditing" | "isCreating") => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    updateQuickLinks({ [change]: !preferences.quickLinks[change] })
    if (tab?.url !== NEW_TAB_URL) chrome.tabs.create({ url: NEW_TAB_URL })
    window.close()
  }

  return (
    <div className="space-y-4">
      <Section
        title="Widgets"
        description={`${enabledCount} of ${WIDGETS.length} shown on the new tab. Hidden widgets make no requests.`}
        action={
          <button
            type="button"
            onClick={() =>
              updateWidgets(
                Object.fromEntries(WIDGETS.map((w) => [w.id, true]))
              )
            }
            className="shrink-0 text-xs text-muted-foreground hover:text-foreground hover:underline">
            Show all
          </button>
        }>
        <div className="space-y-3">
          {WIDGETS.map((widget) => (
            <Row
              key={widget.id}
              label={widget.name}
              hint={widget.hint}
              htmlFor={`widget-${widget.id}`}>
              <Switch
                id={`widget-${widget.id}`}
                checked={on[widget.id]}
                onChange={(checked) => updateWidgets({ [widget.id]: checked })}
              />
            </Row>
          ))}
        </div>
      </Section>

      {on.quickLinks && (
        <Section
          title="Quick links"
          description="Links are added and edited on the new tab.">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => editQuickLinks("isCreating")}>
              <Plus className="h-4 w-4" />
              Add link
            </Button>
            {preferences.quickLinks.links.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => editQuickLinks("isEditing")}>
                <Pencil className="h-4 w-4" />
                {preferences.quickLinks.isEditing
                  ? "Done editing"
                  : "Edit links"}
              </Button>
            )}
          </div>
        </Section>
      )}
    </div>
  )
}

export default WidgetsSettings
