import type {
  IChartApi,
  ISeriesApi,
  SeriesType,
  Time
} from "lightweight-charts"
import {
  AreaSeries,
  CandlestickSeries,
  ColorType,
  createChart,
  LineSeries,
  LineStyle
} from "lightweight-charts"
import { useEffect, useRef } from "react"

import type { ChartType } from "~/context/user-preferences.context"

export interface PricePoint {
  time: Time
  /** Close price */
  value: number
  open?: number
  high?: number
  low?: number
  close?: number
}

interface PriceChartProps {
  data: PricePoint[]
  height?: number
  /** Visible time span ending at the last data point; all data if omitted */
  rangeSeconds?: number
  type?: ChartType
  /** Line/area color (hex) */
  color?: string
  /** Decimals on the price scale */
  precision?: number
  grid?: boolean
}

const DEFAULT_COLOR = "#2962ff"
const TEXT_COLOR = "#888"
const UP_COLOR = "#22c55e"
const DOWN_COLOR = "#ef4444"

/** Sensible decimals for a price: 0.9213 -> 4, 64123.5 -> 2 */
export const autoPrecision = (price: number) =>
  price >= 1000 ? 2 : price >= 1 ? 4 : price >= 0.01 ? 5 : 6

/** "#2962ff" + 0.28 -> "rgba(41, 98, 255, 0.28)" */
const withAlpha = (hex: string, alpha: number) => {
  const match = /^#?([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i.exec(hex)
  if (!match) return `rgba(41, 98, 255, ${alpha})`
  const [r, g, b] = match.slice(1).map((c) => parseInt(c, 16))
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

export const PriceChart = ({
  data,
  height = 150,
  rangeSeconds,
  type = "area",
  color = DEFAULT_COLOR,
  precision = 4,
  grid = true
}: PriceChartProps) => {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const seriesRef = useRef<ISeriesApi<SeriesType> | null>(null)
  const applyRangeRef = useRef<() => void>(() => {})

  applyRangeRef.current = () => {
    const chart = chartRef.current
    if (!chart || !data?.length) return
    if (rangeSeconds) {
      // Anchor to the last data point, not "now": markets close on weekends
      const to = data[data.length - 1].time as number
      chart.timeScale().setVisibleRange({
        from: (to - rangeSeconds) as Time,
        to: to as Time
      })
    } else {
      chart.timeScale().fitContent()
    }
  }

  // Created once; size, series, data and range are applied separately
  useEffect(() => {
    const current = chartContainerRef.current
    if (!current) return

    const chart = createChart(current, {
      width: current.clientWidth,
      height: current.clientHeight,
      layout: {
        textColor: TEXT_COLOR,
        attributionLogo: false,
        background: { type: ColorType.Solid, color: "transparent" }
      },
      timeScale: {
        borderColor: TEXT_COLOR,
        fixRightEdge: true,
        fixLeftEdge: true,
        timeVisible: true
      },
      rightPriceScale: { borderColor: TEXT_COLOR },
      grid: {
        vertLines: { visible: false },
        horzLines: {
          color: "rgba(255, 255, 255, 0.1)",
          style: LineStyle.Solid
        }
      }
    })
    chartRef.current = chart

    // Resizing keeps the bar spacing, so the range is re-applied afterwards
    const resizeObserver = new ResizeObserver(() => {
      chart.resize(current.clientWidth, current.clientHeight)
      applyRangeRef.current()
    })
    resizeObserver.observe(current)

    return () => {
      resizeObserver.disconnect()
      chart.remove()
      chartRef.current = null
      seriesRef.current = null
    }
  }, [])

  useEffect(() => {
    chartRef.current?.applyOptions({ grid: { horzLines: { visible: grid } } })
  }, [grid])

  // Series: recreated when its type or style changes; data is set below
  useEffect(() => {
    const chart = chartRef.current
    if (!chart) return
    const priceFormat = {
      type: "price" as const,
      precision,
      minMove: 1 / 10 ** precision
    }

    if (seriesRef.current) chart.removeSeries(seriesRef.current)
    seriesRef.current =
      type === "candles"
        ? chart.addSeries(CandlestickSeries, {
            upColor: UP_COLOR,
            downColor: DOWN_COLOR,
            borderVisible: false,
            wickUpColor: UP_COLOR,
            wickDownColor: DOWN_COLOR,
            priceFormat
          })
        : type === "line"
          ? chart.addSeries(LineSeries, { color, lineWidth: 2, priceFormat })
          : chart.addSeries(AreaSeries, {
              lineColor: color,
              topColor: color,
              bottomColor: withAlpha(color, 0.28),
              priceFormat
            })
  }, [type, color, precision])

  useEffect(() => {
    const series = seriesRef.current
    if (!series || !data?.length) return
    series.setData(
      type === "candles"
        ? data.map((p) => ({
            time: p.time,
            open: p.open ?? p.value,
            high: p.high ?? p.value,
            low: p.low ?? p.value,
            close: p.close ?? p.value
          }))
        : data.map((p) => ({ time: p.time, value: p.value }))
    )
    applyRangeRef.current()
  }, [data, rangeSeconds, type, color, precision])

  // min-w-0/overflow-hidden: the canvas must never push past the popover padding
  return (
    <div
      ref={chartContainerRef}
      className="w-full min-w-0 overflow-hidden"
      style={{ height }}
    />
  )
}

export default PriceChart
