import "./globals.css"
import "./popup.css"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

import { UserPreferencesProvider } from "./context/user-preferences.context"
import ConfigPopup from "./pages/config-popup"

function Popup() {
  const queryClient = new QueryClient()
  return (
    <QueryClientProvider client={queryClient}>
      <UserPreferencesProvider>
        <ConfigPopup />
      </UserPreferencesProvider>
    </QueryClientProvider>
  )
}

export default Popup
