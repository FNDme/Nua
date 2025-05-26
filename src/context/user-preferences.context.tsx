import { createContext, useContext, useEffect } from "react"
import type { FC, ReactNode } from "react"
import type { ColorId } from "unsplash-js"

import { useStorage } from "@plasmohq/storage/hook"

import { PREFERENCES_KEY } from "~/constants"

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
}

interface UserPreferencesContextType {
  preferences: UserPreferences
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
  ticker: "USD/EUR"
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
  const [preferences, setPreferences] = useStorage<UserPreferences>(
    PREFERENCES_KEY,
    (v) => (v === undefined ? defaultPreferences : v)
  )

  const updatePreferences = (newPreferences: Partial<UserPreferences>) => {
    if (newPreferences.quickLinks.links.length === 0)
      newPreferences.quickLinks.isEditing = false
    setPreferences((prev) => ({
      ...prev,
      ...newPreferences
    }))
  }

  const updateBackgroundTerm = (props: { query?: string; color?: ColorId }) => {
    setPreferences({
      ...preferences,
      background: {
        ...preferences.background,
        ...props,
        pageIndex: 1,
        photoIndex: 0
      }
    })
  }

  const updateBackgroundPosition = (props: {
    pageIndex?: number
    photoIndex?: number
  }) => {
    setPreferences({
      ...preferences,
      background: {
        ...preferences.background,
        ...props
      }
    })
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
    setPreferences({
      ...preferences,
      ticker: newTicker
    })
  }

  return (
    <UserPreferencesContext.Provider
      value={{
        preferences,
        updatePreferences,
        updateBackgroundTerm,
        updateBackgroundPosition,
        updateQuickLinks,
        updateTicker
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
