import debounce from "lodash.debounce"
import { useCallback, useEffect, useState } from "react"

import { Input } from "~/components/ui/input"
import { SegmentedControl } from "~/components/ui/segmented-control"
import {
  useUserPreferences,
  type ChartType
} from "~/context/user-preferences.context"
import { cn } from "~/lib/utils"

import { Row, Section, Switch } from "./settings-ui"

const COLORS = [
  { value: "#2962ff", name: "Blue" },
  { value: "#22c55e", name: "Green" },
  { value: "#f59e0b", name: "Amber" },
  { value: "#f43f5e", name: "Rose" },
  { value: "#a855f7", name: "Purple" },
  { value: "#e5e5e5", name: "White" }
]

const CHART_TYPES: { value: ChartType; label: string }[] = [
  { value: "area", label: "Area" },
  { value: "line", label: "Line" },
  { value: "candles", label: "Candles" }
]

const PRECISIONS = [
  { value: "0", label: "Auto" },
  { value: "2", label: "2" },
  { value: "4", label: "4" },
  { value: "6", label: "6" }
]

function CurrencySettings() {
  const { preferences, updateTicker, updateChart } = useUserPreferences()
  const chart = preferences.chart
  const [ticker, setTicker] = useState(preferences.ticker ?? "")

  useEffect(() => setTicker(preferences.ticker ?? ""), [preferences.ticker])

  // Each change triggers a (rate limited) Twelve Data request on open tabs
  const saveTicker = useCallback(
    debounce((value: string) => {
      if (value.trim()) updateTicker(value.trim().toUpperCase())
    }, 800),
    []
  )

  return (
    <div className="space-y-4">
      <Section
        title="Ticker"
        description="Any Twelve Data symbol: USD/EUR, BTC/USD, AAPL…">
        <Input
          value={ticker}
          onChange={(e) => {
            setTicker(e.target.value)
            saveTicker(e.target.value)
          }}
          placeholder="USD/EUR"
          aria-label="Ticker"
          spellCheck={false}
        />
      </Section>

      <Section
        title="Chart"
        description="Range and size are picked on the chart itself.">
        <Row label="Style">
          <SegmentedControl
            aria-label="Chart style"
            options={CHART_TYPES}
            value={chart.type}
            onChange={(type) => updateChart({ type })}
          />
        </Row>
        <Row
          label="Color"
          hint={
            chart.type === "candles" ? "Candles use green and red" : undefined
          }>
          <div
            className="flex gap-1.5"
            role="radiogroup"
            aria-label="Chart color">
            {COLORS.map((color) => (
              <button
                key={color.value}
                type="button"
                role="radio"
                aria-checked={chart.color === color.value}
                aria-label={color.name}
                title={color.name}
                disabled={chart.type === "candles"}
                onClick={() => updateChart({ color: color.value })}
                style={{ backgroundColor: color.value }}
                className={cn(
                  "h-6 w-6 rounded-full ring-offset-2 ring-offset-[#262626] transition disabled:opacity-30",
                  chart.color === color.value && "ring-2 ring-white"
                )}
              />
            ))}
          </div>
        </Row>
        <Row label="Decimals" hint="Auto: 2 for large prices, 4–6 for small">
          <SegmentedControl
            aria-label="Price decimals"
            options={PRECISIONS}
            value={String(chart.precision ?? 0)}
            onChange={(value) => updateChart({ precision: Number(value) })}
          />
        </Row>
        <Row label="Grid lines" htmlFor="chart-grid">
          <Switch
            id="chart-grid"
            checked={chart.grid}
            onChange={(grid) => updateChart({ grid })}
          />
        </Row>
      </Section>
    </div>
  )
}

export default CurrencySettings
