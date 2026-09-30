import { createContext, useContext } from "react"
import type { FC, ReactNode } from "react"
import type { ColorId } from "unsplash-js"

import { useStorage } from "@plasmohq/storage/hook"

import { PREFERENCES_KEY } from "~/constants"
import {
  DEFAULT_POMODORO_SETTINGS,
  type PomodoroSettings
} from "~/lib/pomodoro-settings"

export type ChartSize = "sm" | "md" | "lg"
export type ChartRange = "1D" | "1W" | "1M" | "3M" | "1Y" | "ALL"
/** A news tab backed by an RSS/Atom feed */
export interface NewsFeed {
  id: string
  url: string
  name: string
  /** Short tab label */
  label: string
}

/** Feeds shown until the user edits the list (see the popup's News feeds) */
export const DEFAULT_NEWS_FEEDS: NewsFeed[] = [
  {
    id: "verge",
    url: "https://www.theverge.com/rss/index.xml",
    name: "The Verge",
    label: "Verge"
  },
  {
    id: "ars",
    url: "https://feeds.arstechnica.com/arstechnica/index",
    name: "Ars Technica",
    label: "Ars"
  },
  {
    id: "techcrunch",
    url: "https://techcrunch.com/feed/",
    name: "TechCrunch",
    label: "TC"
  },
  {
    id: "bbc",
    url: "https://feeds.bbci.co.uk/news/rss.xml",
    name: "BBC News",
    label: "BBC"
  }
]

export type BackgroundMode = "search" | "favorites"

export type NotesTab = "todo" | "note"

export type WidgetId =
  | "background"
  | "quickLinks"
  | "workTimer"
  | "currency"
  | "pomodoro"
  | "search"
  | "news"
  | "notes"
  | "clock"

export type ChartType = "area" | "line" | "candles"

export interface WorkTimerSettings {
  /** "HH:MM" */
  start: string
  end: string
  /** Days of the week it shows on, 0 = Sunday */
  days: number[]
  style: "bar" | "ring"
  /** Show "3h 12m left" next to the bar */
  showRemaining: boolean
}

export interface UserPreferences {
  background: {
    query: string
    color?: ColorId
    pageIndex: number
    photoIndex: number
    /** Cycle through search results or through saved favorites */
    mode?: BackgroundMode
    favoriteIndex?: number
  }
  quickLinks: {
    links: { name: string; url: string; icon: string }[]
    isEditing: boolean
    isCreating: boolean
  }
  ticker: string
  chart: {
    size: ChartSize
    range: ChartRange
    type: ChartType
    /** Line/area color (hex) */
    color: string
    /** Decimals shown for prices; 0 = automatic */
    precision: number
    grid: boolean
  }
  workTimer: WorkTimerSettings
  widgets: Record<WidgetId, boolean>
  news: {
    /** "hn" or a feed id */
    source: string
    feeds: NewsFeed[]
  }
  pomodoro: PomodoroSettings
  notes: {
    tab: NotesTab
    collapsed: boolean
  }
}

interface UserPreferencesContextType {
  preferences: UserPreferences
  /** True until the stored preferences have been read */
  isLoading: boolean
  updatePreferences: (newPreferences: Partial<UserPreferences>) => void
  updateBackgroundTerm: ({
    query,
    color
  }: {
    query?: string
    color?: ColorId
  }) => void
  /** Switch between search results and favorites, or pick a favorite */
  updateBackgroundFavorites: (props: {
    mode?: BackgroundMode
    favoriteIndex?: number
  }) => void
  updateBackgroundPosition: ({
    pageIndex,
    photoIndex
  }: {
    pageIndex?: number
    photoIndex?: number
  }) => void
  updateQuickLinks: (
    newQuickLinks: Partial<UserPreferences["quickLinks"]>
  ) => void
  updateTicker: (newTicker: string) => void
  updateChart: (newChart: Partial<UserPreferences["chart"]>) => void
  updateNews: (newNews: Partial<UserPreferences["news"]>) => void
  /** Functional update so quick successive edits never drop each other */
  updateNewsFeeds: (update: (feeds: NewsFeed[]) => NewsFeed[]) => void
  updatePomodoro: (settings: Partial<PomodoroSettings>) => void
  updateWorkTimer: (settings: Partial<WorkTimerSettings>) => void
  updateWidgets: (widgets: Partial<Record<WidgetId, boolean>>) => void
  updateNotes: (notes: Partial<UserPreferences["notes"]>) => void
}

export const defaultPreferences: UserPreferences = {
  background: {
    query: "mountains",
    pageIndex: 1,
    photoIndex: 0,
    mode: "search",
    favoriteIndex: 0
  },
  quickLinks: {
    links: [],
    isEditing: false,
    isCreating: false
  },
  ticker: "USD/EUR",
  chart: {
    size: "md",
    range: "1M",
    type: "area",
    color: "#2962ff",
    precision: 0,
    grid: true
  },
  workTimer: {
    start: "08:00",
    end: "17:00",
    days: [1, 2, 3, 4, 5],
    style: "bar",
    showRemaining: false
  },
  widgets: {
    background: true,
    quickLinks: true,
    workTimer: true,
    currency: true,
    pomodoro: true,
    search: true,
    news: true,
    notes: true,
    clock: true
  },
  news: {
    source: "hn",
    feeds: DEFAULT_NEWS_FEEDS
  },
  pomodoro: DEFAULT_POMODORO_SETTINGS,
  notes: {
    tab: "todo",
    collapsed: false
  }
}

/** Stored preferences may predate newer (nested) fields: fill them from defaults */
export const withDefaults = (v?: Partial<UserPreferences>): UserPreferences =>
  v === undefined
    ? defaultPreferences
    : {
        ...defaultPreferences,
        ...v,
        background: { ...defaultPreferences.background, ...v.background },
        chart: { ...defaultPreferences.chart, ...v.chart },
        workTimer: { ...defaultPreferences.workTimer, ...v.workTimer },
        widgets: { ...defaultPreferences.widgets, ...v.widgets },
        news: { ...defaultPreferences.news, ...v.news },
        pomodoro: { ...defaultPreferences.pomodoro, ...v.pomodoro },
        notes: { ...defaultPreferences.notes, ...v.notes }
      }

const UserPreferencesContext = createContext<
  UserPreferencesContextType | undefined
>(undefined)

interface UserPreferencesProviderProps {
  children: ReactNode
}

export const UserPreferencesProvider: FC<UserPreferencesProviderProps> = ({
  children
}) => {
  // Stored preferences may predate newer fields, so fill them from defaults
  const [preferences, setPreferences, { isLoading }] =
    useStorage<UserPreferences>(PREFERENCES_KEY, withDefaults)

  // All updates use the functional form so callers holding an old closure
  // (e.g. debounced handlers) never overwrite newer values with stale ones
  const updatePreferences = (newPreferences: Partial<UserPreferences>) => {
    if (newPreferences.quickLinks?.links.length === 0)
      newPreferences.quickLinks.isEditing = false
    setPreferences((prev) => ({
      ...prev,
      ...newPreferences
    }))
  }

  const updateBackgroundTerm = (props: { query?: string; color?: ColorId }) => {
    setPreferences((prev) => ({
      ...prev,
      background: {
        ...prev.background,
        ...props,
        pageIndex: 1,
        photoIndex: 0,
        mode: "search"
      }
    }))
  }

  const updateBackgroundFavorites = (props: {
    mode?: BackgroundMode
    favoriteIndex?: number
  }) => {
    setPreferences((prev) => ({
      ...prev,
      background: { ...prev.background, ...props }
    }))
  }

  const updateBackgroundPosition = (props: {
    pageIndex?: number
    photoIndex?: number
  }) => {
    setPreferences((prev) => ({
      ...prev,
      background: {
        ...prev.background,
        ...props
      }
    }))
  }

  const updateQuickLinks = (
    newQuickLinks: Partial<UserPreferences["quickLinks"]>
  ) => {
    setPreferences((prev) => ({
      ...prev,
      quickLinks: { ...prev.quickLinks, ...newQuickLinks }
    }))
  }

  const updateTicker = (newTicker: string) => {
    setPreferences((prev) => ({
      ...prev,
      ticker: newTicker
    }))
  }

  const updateChart = (newChart: Partial<UserPreferences["chart"]>) => {
    setPreferences((prev) => ({
      ...prev,
      chart: { ...defaultPreferences.chart, ...prev.chart, ...newChart }
    }))
  }

  const updateNews = (newNews: Partial<UserPreferences["news"]>) => {
    setPreferences((prev) => ({
      ...prev,
      news: { ...defaultPreferences.news, ...prev.news, ...newNews }
    }))
  }

  const updateNewsFeeds = (update: (feeds: NewsFeed[]) => NewsFeed[]) => {
    setPreferences((prev) => {
      const news = { ...defaultPreferences.news, ...prev.news }
      return { ...prev, news: { ...news, feeds: update(news.feeds) } }
    })
  }

  const updatePomodoro = (settings: Partial<PomodoroSettings>) => {
    setPreferences((prev) => ({
      ...prev,
      pomodoro: { ...DEFAULT_POMODORO_SETTINGS, ...prev.pomodoro, ...settings }
    }))
  }

  const updateWorkTimer = (settings: Partial<WorkTimerSettings>) => {
    setPreferences((prev) => ({
      ...prev,
      workTimer: {
        ...defaultPreferences.workTimer,
        ...prev.workTimer,
        ...settings
      }
    }))
  }

  const updateWidgets = (widgets: Partial<Record<WidgetId, boolean>>) => {
    setPreferences((prev) => ({
      ...prev,
      widgets: { ...defaultPreferences.widgets, ...prev.widgets, ...widgets }
    }))
  }

  const updateNotes = (notes: Partial<UserPreferences["notes"]>) => {
    setPreferences((prev) => ({
      ...prev,
      notes: { ...defaultPreferences.notes, ...prev.notes, ...notes }
    }))
  }

  return (
    <UserPreferencesContext.Provider
      value={{
        preferences,
        isLoading,
        updatePreferences,
        updateBackgroundTerm,
        updateBackgroundFavorites,
        updateBackgroundPosition,
        updateQuickLinks,
        updateTicker,
        updateChart,
        updateNews,
        updateNewsFeeds,
        updatePomodoro,
        updateWorkTimer,
        updateWidgets,
        updateNotes
      }}>
      {children}
    </UserPreferencesContext.Provider>
  )
}

export const useUserPreferences = () => {
  const context = useContext(UserPreferencesContext)
  if (context === undefined) {
    throw new Error(
      "useUserPreferences must be used within a UserPreferencesProvider"
    )
  }
  return context
}
