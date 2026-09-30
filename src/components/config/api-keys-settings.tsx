import { Check, ExternalLink, Eye, EyeOff, Loader2 } from "lucide-react"
import { useState, type FormEvent } from "react"

import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import { API_SERVICES, useApiKeys, type ApiService } from "~/lib/api-keys"
import { checkApiKey } from "~/lib/api-keys-validate"
import { cn } from "~/lib/utils"

import { Section } from "./settings-ui"

const mask = (key: string) =>
  key.length <= 4 ? "••••" : `••••••${key.slice(-4)}`

function ApiKeyCard({ service }: { service: ApiService }) {
  const { keys, setKey } = useApiKeys()
  const info = API_SERVICES[service]
  const saved = keys[service]

  const [value, setValue] = useState("")
  const [visible, setVisible] = useState(false)
  const [checking, setChecking] = useState(false)
  const [message, setMessage] = useState<{
    tone: "ok" | "error"
    text: string
  } | null>(null)

  const save = async (e: FormEvent) => {
    e.preventDefault()
    const key = value.trim()
    if (!key) return
    setChecking(true)
    setMessage(null)
    const result = await checkApiKey(service, key)
    setChecking(false)

    if (result.ok) {
      setKey(service, key)
      setValue("")
      setMessage({ tone: "ok", text: result.detail ?? "Key saved." })
    } else if (result.reason === "invalid") {
      setMessage({ tone: "error", text: `${info.name} rejected this key.` })
    } else {
      // Can't tell right now (offline, rate limited): save it anyway
      setKey(service, key)
      setValue("")
      setMessage({
        tone: "error",
        text: `Saved, but it couldn't be checked${result.detail ? ` (${result.detail})` : ""}.`
      })
    }
  }

  return (
    <Section
      title={info.name}
      description={info.usedFor}
      action={
        <span
          className={cn(
            "flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px]",
            saved
              ? "bg-emerald-500/15 text-emerald-300"
              : "bg-amber-500/15 text-amber-300"
          )}>
          {saved ? (
            <>
              <Check className="h-3 w-3" /> {mask(saved)}
            </>
          ) : (
            "Not set"
          )}
        </span>
      }>
      <form onSubmit={save} className="flex gap-2">
        <div className="relative flex-1">
          <Input
            type={visible ? "text" : "password"}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={saved ? "Replace key" : "Paste your key"}
            aria-label={`${info.name} API key`}
            autoComplete="off"
            spellCheck={false}
            className="pr-9"
          />
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? "Hide key" : "Show key"}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            {visible ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
        <Button
          type="submit"
          variant="outline"
          disabled={!value.trim() || checking}>
          {checking && <Loader2 className="h-4 w-4 animate-spin" />}
          {checking ? "Checking" : "Save"}
        </Button>
      </form>
      <div className="flex items-center justify-between text-xs">
        <a
          href={info.signupUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground hover:underline">
          Get a free key <ExternalLink className="h-3 w-3" />
        </a>
        {saved && (
          <button
            type="button"
            onClick={() => {
              setKey(service, undefined)
              setMessage(null)
            }}
            className="text-muted-foreground hover:text-red-400 hover:underline">
            Remove key
          </button>
        )}
      </div>
      {message && (
        <p
          role="status"
          className={cn(
            "text-xs",
            message.tone === "ok" ? "text-emerald-300" : "text-red-400"
          )}>
          {message.text}
        </p>
      )}
    </Section>
  )
}

function ApiKeysSettings() {
  return (
    <div className="space-y-4">
      <p className="text-xs leading-relaxed text-muted-foreground">
        Nua doesn't ship with API keys, since anything inside an extension can
        be read by whoever installs it. Your keys stay on this device, in
        storage only Nua can read, and are sent only to their own service.
      </p>
      <ApiKeyCard service="unsplash" />
      <ApiKeyCard service="twelveData" />
    </div>
  )
}

export default ApiKeysSettings
