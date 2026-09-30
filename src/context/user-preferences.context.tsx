import { createContext, useContext } from "react"
import type { FC, ReactNode } from "react"
import type { ColorId } from "unsplash-js"

import { useStorage } from "@plasmohq/storage/hook"

import { PREFERENCES_KEY } from "~/constants"

export type ChartSize = "sm" | "md" | "lg"
export type ChartRange = "1D" | "1W" | "1M" | "3M" | "ALL"

interface UserPreferences {
  background: {
    query: string
    color?: ColorId
    pageIndex: number
    photoIndex: number
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
}

const defaultPreferences: UserPreferences = {
  background: {
    query: "mountains",
    pageIndex: 1,
    photoIndex: 0
  },
  quickLinks: {
    links: [],
    isEditing: false,
    isCreating: false
  },
  ticker: "USD/EUR",
  chart: {
    size: "md",
    range: "1M"
  }
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
    useStorage<UserPreferences>(PREFERENCES_KEY, (v) =>
      v === undefined ? defaultPreferences : { ...defaultPreferences, ...v }
    )

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
        photoIndex: 0
      }
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
      chart: { ...prev.chart, ...newChart }
    }))
  }

  return (
    <UserPreferencesContext.Provider
      value={{
        preferences,
        isLoading,
        updatePreferences,
        updateBackgroundTerm,
        updateBackgroundPosition,
        updateQuickLinks,
        updateTicker,
        updateChart
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
