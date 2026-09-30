import {
  Image,
  KeyRound,
  LayoutGrid,
  LineChart,
  Newspaper,
  Timer,
  type LucideIcon
} from "lucide-react"
import { useEffect, useRef, useState } from "react"

import ApiKeysSettings from "~/components/config/api-keys-settings"
import BackgroundSettings from "~/components/config/background-settings"
import CurrencySettings from "~/components/config/currency-settings"
import NewsFeedsSettings from "~/components/config/news-feeds-settings"
import TimersSettings from "~/components/config/timers-settings"
import WidgetsSettings from "~/components/config/widgets-settings"
import {
  useUserPreferences,
  type WidgetId
} from "~/context/user-preferences.context"
import { useApiKeys } from "~/lib/api-keys"
import { takeRequestedSettingsTab, type SettingsTab } from "~/lib/open-settings"
import { cn } from "~/lib/utils"

const TABS: {
  id: SettingsTab
  label: string
  icon: LucideIcon
  /** Dimmed in the menu when all of these widgets are hidden */
  widgets?: WidgetId[]
  render: () => JSX.Element
}[] = [
  {
    id: "widgets",
    label: "Widgets",
    icon: LayoutGrid,
    render: () => <WidgetsSettings />
  },
  {
    id: "background",
    label: "Background",
    icon: Image,
    widgets: ["background"],
    render: () => <BackgroundSettings />
  },
  {
    id: "timers",
    label: "Timers",
    icon: Timer,
    widgets: ["workTimer", "pomodoro"],
    render: () => <TimersSettings />
  },
  {
    id: "currency",
    label: "Currency",
    icon: LineChart,
    widgets: ["currency"],
    render: () => <CurrencySettings />
  },
  {
    id: "news",
    label: "News",
    icon: Newspaper,
    widgets: ["news"],
    render: () => <NewsFeedsSettings />
  },
  {
    id: "keys",
    label: "API keys",
    icon: KeyRound,
    render: () => <ApiKeysSettings />
  }
]

const LAST_TAB_KEY = "nua-settings-last-tab"

const readLastTab = (): SettingsTab => {
  try {
    const tab = localStorage.getItem(LAST_TAB_KEY) as SettingsTab | null
    return TABS.some((t) => t.id === tab) ? tab : "widgets"
  } catch {
    return "widgets"
  }
}

function ConfigPopup() {
  const { preferences } = useUserPreferences()
  const { keys, isLoading: isLoadingKeys } = useApiKeys()
  const [tab, setTab] = useState<SettingsTab>(readLastTab)
  const contentRef = useRef<HTMLDivElement>(null)

  // A "settings" link on the new tab can ask for a specific tab
  useEffect(() => {
    takeRequestedSettingsTab()
      .then((requested) => requested && setTab(requested))
      .catch(() => {})
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(LAST_TAB_KEY, tab)
    } catch {
      // Storage unavailable: just don't remember the tab
    }
    contentRef.current?.scrollTo({ top: 0 })
  }, [tab])

  // Flag missing keys only for widgets that are turned on
  const needsKeys =
    !isLoadingKeys &&
    ((preferences.widgets.background &&
      preferences.background?.mode !== "favorites" &&
      !keys.unsplash) ||
      (preferences.widgets.currency && !keys.twelveData))

  const active = TABS.find((t) => t.id === tab) ?? TABS[0]

  return (
    <div className="flex h-[560px] w-[600px] flex-col bg-[#1c1c1c] text-foreground">
      <header className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <div className="flex items-baseline gap-2">
          <span className="text-base font-semibold tracking-tight">Nua</span>
          <span className="text-xs text-muted-foreground">Settings</span>
        </div>
        <span className="text-[11px] text-muted-foreground">
          v{chrome.runtime.getManifest().version}
        </span>
      </header>

      <div className="flex min-h-0 flex-1">
        <nav
          aria-label="Settings sections"
          className="flex w-40 shrink-0 flex-col gap-0.5 border-r border-white/10 p-2">
          {TABS.map((item) => {
            const Icon = item.icon
            const hidden =
              item.widgets && item.widgets.every((w) => !preferences.widgets[w])
            const selected = item.id === active.id
            return (
              <button
                key={item.id}
                type="button"
                aria-current={selected ? "page" : undefined}
                onClick={() => setTab(item.id)}
                title={hidden ? `${item.label} (widget hidden)` : undefined}
                className={cn(
                  "flex items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm transition-colors",
                  selected
                    ? "bg-white/10 text-foreground"
                    : "text-muted-foreground hover:bg-white/5 hover:text-foreground",
                  hidden && !selected && "opacity-50"
                )}>
                <Icon className="h-4 w-4 shrink-0" />
                <span className="flex-1 truncate">{item.label}</span>
                {item.id === "keys" && needsKeys && (
                  <span
                    className="h-2 w-2 rounded-full bg-amber-400"
                    aria-label="A key is missing"
                  />
                )}
              </button>
            )
          })}
        </nav>

        <main
          ref={contentRef}
          className="min-w-0 flex-1 overflow-y-auto p-4 [scrollbar-width:thin]">
          <h1 className="mb-3 text-lg font-semibold">{active.label}</h1>
          {active.render()}
        </main>
      </div>
    </div>
  )
}

export default ConfigPopup
