import { TooltipProvider } from "@/components/ui/tooltip"
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { persistQueryClient } from "@tanstack/react-query-persist-client"
import { useEffect, useRef } from "react"

import Home from "./pages/home"

import "./globals.css"

import { UserPreferencesProvider } from "./context/user-preferences.context"
import { MissingApiKeyError, useApiKeys } from "./lib/api-keys"

export const CACHE_EXPIRY = 1000 * 60 * 60 * 24 // 24 hours

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: CACHE_EXPIRY,
      gcTime: CACHE_EXPIRY,
      // Retrying can't help until a key is entered in the popup
      retry: (count, error) =>
        !(error instanceof MissingApiKeyError) && count < 3
    }
  }
})

const persister = createSyncStoragePersister({
  storage: localStorage
})

persistQueryClient({
  queryClient,
  persister,
  maxAge: 1000 * 60 * 60 * 24 // 24 hours
})

/** Refetches keyed APIs as soon as a key is added or changed in the popup */
function ApiKeyWatcher() {
  const { keys, isLoading } = useApiKeys()
  const previous = useRef<typeof keys | null>(null)
  useEffect(() => {
    if (isLoading) return
    const before = previous.current
    previous.current = keys
    if (!before) return
    if (before.unsplash !== keys.unsplash) {
      queryClient.resetQueries({ queryKey: ["images"] })
      queryClient.resetQueries({ queryKey: ["image-info"] })
    }
    if (before.twelveData !== keys.twelveData) {
      queryClient.resetQueries({ queryKey: ["currency"] })
    }
  }, [keys.unsplash, keys.twelveData, isLoading])
  return null
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <UserPreferencesProvider>
        <ApiKeyWatcher />
        <TooltipProvider>
          <Home />
        </TooltipProvider>
      </UserPreferencesProvider>
    </QueryClientProvider>
  )
}
