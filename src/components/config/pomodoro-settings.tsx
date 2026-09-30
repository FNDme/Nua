import { useEffect, useState } from "react"

import { Input } from "~/components/ui/input"
import { useUserPreferences } from "~/context/user-preferences.context"
import {
  DEFAULT_POMODORO_SETTINGS,
  type PomodoroSettings
} from "~/lib/pomodoro-settings"

import { Row, Section, Switch } from "./settings-ui"

type NumberField = {
  [K in keyof PomodoroSettings]: PomodoroSettings[K] extends number ? K : never
}[keyof PomodoroSettings]

const NUMBER_FIELDS: {
  key: NumberField
  label: string
  min: number
  max: number
}[] = [
  { key: "focusMinutes", label: "Focus", min: 1, max: 180 },
  { key: "shortBreakMinutes", label: "Short", min: 1, max: 60 },
  { key: "longBreakMinutes", label: "Long", min: 1, max: 120 },
  { key: "longBreakEvery", label: "Long after", min: 1, max: 12 }
]

const TOGGLES: {
  key: "autoStartBreaks" | "autoStartFocus" | "notify"
  label: string
}[] = [
  { key: "autoStartBreaks", label: "Start breaks automatically" },
  { key: "autoStartFocus", label: "Start focus automatically after a break" },
  { key: "notify", label: "Notify when a phase ends" }
]

/** A number box that only saves whole values within range */
function NumberSetting({
  label,
  value,
  min,
  max,
  onChange
}: {
  label: string
  value: number
  min: number
  max: number
  onChange: (value: number) => void
}) {
  const [text, setText] = useState(String(value))
  useEffect(() => setText(String(value)), [value])

  const parsed = Number(text)
  const valid = Number.isInteger(parsed) && parsed >= min && parsed <= max

  return (
    <label className="space-y-1 text-xs text-muted-foreground">
      <span>{label}</span>
      <Input
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        value={text}
        aria-invalid={!valid || undefined}
        onChange={(e) => {
          setText(e.target.value)
          const next = Number(e.target.value)
          if (Number.isInteger(next) && next >= min && next <= max) {
            onChange(next)
          }
        }}
        onBlur={() => !valid && setText(String(value))}
        className="h-8 aria-[invalid]:border-red-400"
      />
    </label>
  )
}

function PomodoroSettingsSection() {
  const { preferences, updatePomodoro } = useUserPreferences()
  const settings = { ...DEFAULT_POMODORO_SETTINGS, ...preferences.pomodoro }

  return (
    <Section
      title="Pomodoro"
      description="New durations apply from the next phase you start."
      action={
        <button
          type="button"
          onClick={() => updatePomodoro(DEFAULT_POMODORO_SETTINGS)}
          className="shrink-0 text-xs text-muted-foreground hover:text-foreground hover:underline">
          Reset to 25/5/15
        </button>
      }>
      <div className="grid grid-cols-4 gap-2">
        {NUMBER_FIELDS.map((field) => (
          <NumberSetting
            key={field.key}
            label={field.label}
            min={field.min}
            max={field.max}
            value={settings[field.key]}
            onChange={(value) => updatePomodoro({ [field.key]: value })}
          />
        ))}
      </div>
      <p className="text-[11px] text-muted-foreground">
        Focus, short and long break in minutes; a long break comes after that
        many focus sessions.
      </p>
      <div className="space-y-3 pt-1">
        {TOGGLES.map((toggle) => (
          <Row
            key={toggle.key}
            label={toggle.label}
            htmlFor={`pomodoro-${toggle.key}`}>
            <Switch
              id={`pomodoro-${toggle.key}`}
              checked={settings[toggle.key]}
              onChange={(checked) => updatePomodoro({ [toggle.key]: checked })}
            />
          </Row>
        ))}
      </div>
    </Section>
  )
}

export default PomodoroSettingsSection
