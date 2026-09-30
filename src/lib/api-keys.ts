import { Storage } from "@plasmohq/storage"
import { useStorage } from "@plasmohq/storage/hook"

import { API_KEYS_KEY } from "~/constants"

/**
 * Keys the user enters in the popup. They are never bundled into the build,
 * since anything in an extension package can be read by whoever installs it.
 * Local area: stays on this device and is readable only by the extension.
 */
export interface ApiKeys {
  unsplash?: string
  twelveData?: string
}

export type ApiService = keyof ApiKeys

export const API_SERVICES: Record<
  ApiService,
  { name: string; signupUrl: string; usedFor: string }
> = {
  unsplash: {
    name: "Unsplash",
    signupUrl: "https://unsplash.com/oauth/applications",
    usedFor: "Background photos (Access Key)"
  },
  twelveData: {
    name: "Twelve Data",
    signupUrl: "https://twelvedata.com/register",
    usedFor: "Currency and ticker prices"
  }
}

export class MissingApiKeyError extends Error {
  constructor(public service: ApiService) {
    super(`No ${API_SERVICES[service].name} API key set`)
  }
}

export const apiKeysStorage = new Storage({ area: "local" })

export const readApiKey = async (service: ApiService) => {
  const keys = await apiKeysStorage.get<ApiKeys>(API_KEYS_KEY)
  const key = keys?.[service]?.trim()
  if (!key) throw new MissingApiKeyError(service)
  return key
}

export function useApiKeys() {
  const [keys, setKeys, { isLoading }] = useStorage<ApiKeys>(
    { key: API_KEYS_KEY, instance: apiKeysStorage },
    (v) => v ?? {}
  )
  const setKey = (service: ApiService, value?: string) =>
    setKeys((prev = {}) => ({ ...prev, [service]: value?.trim() || undefined }))
  return { keys: keys ?? {}, setKey, isLoading }
}
