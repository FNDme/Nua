import { useEffect, useState } from "react"

import { Input } from "~/components/ui/input"
import { SegmentedControl } from "~/components/ui/segmented-control"
import { useUserPreferences } from "~/context/user-preferences.context"
import { cn } from "~/lib/utils"

import PomodoroSettingsSection from "./pomodoro-settings"
import { Row, Section, Switch } from "./settings-ui"

// Monday first; values are Date.getDay() numbers
const DAYS = [
  { day: 1, label: "M", name: "Monday" },
  { day: 2, label: "T", name: "Tuesday" },
  { day: 3, label: "W", name: "Wednesday" },
  { day: 4, label: "T", name: "Thursday" },
  { day: 5, label: "F", name: "Friday" },
  { day: 6, label: "S", name: "Saturday" },
  { day: 0, label: "S", name: "Sunday" }
]

/** Saves only complete times; a half-typed value reverts on blur */
function TimeField({
  id,
  value,
  onChange
}: {
  id: string
  value: string
  onChange: (value: string) => void
}) {
  const [text, setText] = useState(value)
  useEffect(() => setText(value), [value])
  return (
    <Input
      id={id}
      type="time"
      value={text}
      onChange={(e) => {
        setText(e.target.value)
        if (/^\d{2}:\d{2}$/.test(e.target.value)) onChange(e.target.value)
      }}
      onBlur={() => setText(value)}
      className="h-8 w-28"
    />
  )
}

function WorkDaySettings() {
  const { preferences, updateWorkTimer } = useUserPreferences()
  const settings = preferences.workTimer
  const invalid = settings.end <= settings.start

  const toggleDay = (day: number) =>
    updateWorkTimer({
      days: settings.days.includes(day)
        ? settings.days.filter((d) => d !== day)
        : [...settings.days, day]
    })

  return (
    <Section
      title="Work day"
      description="The progress bar at the top of the new tab.">
      <Row label="Starts" htmlFor="work-start">
        <TimeField
          id="work-start"
          value={settings.start}
          onChange={(start) => updateWorkTimer({ start })}
        />
      </Row>
      <Row label="Ends" htmlFor="work-end">
        <TimeField
          id="work-end"
          value={settings.end}
          onChange={(end) => updateWorkTimer({ end })}
        />
      </Row>
      {invalid && (
        <p className="text-xs text-red-400">
          The end time must be after the start time; the bar is hidden until
          then.
        </p>
      )}
      <Row label="Days">
        <div className="flex gap-1" role="group" aria-label="Work days">
          {DAYS.map(({ day, label, name }) => {
            const active = settings.days.includes(day)
            return (
              <button
                key={day}
                type="button"
                title={name}
                aria-label={name}
                aria-pressed={active}
                onClick={() => toggleDay(day)}
                className={cn(
                  "h-7 w-7 rounded-full text-xs transition-colors",
                  active
                    ? "bg-rose-400 font-medium text-zinc-900"
                    : "bg-white/10 text-muted-foreground hover:text-foreground"
                )}>
                {label}
              </button>
            )
          })}
        </div>
      </Row>
      <Row label="Style" hint="Small screens always use the ring">
        <SegmentedControl
          aria-label="Work day style"
          options={[
            { value: "bar", label: "Bar" },
            { value: "ring", label: "Ring" }
          ]}
          value={settings.style}
          onChange={(style) => updateWorkTimer({ style })}
        />
      </Row>
      <Row
        label="Show time left"
        hint={'e.g. "3h 12m left" next to the bar'}
        htmlFor="work-remaining">
        <Switch
          id="work-remaining"
          checked={settings.showRemaining}
          onChange={(showRemaining) => updateWorkTimer({ showRemaining })}
        />
      </Row>
    </Section>
  )
}

function TimersSettings() {
  return (
    <div className="space-y-4">
      <WorkDaySettings />
      <PomodoroSettingsSection />
    </div>
  )
}

export default TimersSettings
