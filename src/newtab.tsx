import { TooltipProvider } from "@/components/ui/tooltip"
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { persistQueryClient } from "@tanstack/react-query-persist-client"

import Home from "./pages/home"

import "./globals.css"

import { UserPreferencesProvider } from "./context/user-preferences.context"

export const CACHE_EXPIRY = 1000 * 60 * 60 * 24 // 24 hours

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: CACHE_EXPIRY,
      gcTime: CACHE_EXPIRY
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

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <UserPreferencesProvider>
        <TooltipProvider>
          <Home />
        </TooltipProvider>
      </UserPreferencesProvider>
    </QueryClientProvider>
  )
}
