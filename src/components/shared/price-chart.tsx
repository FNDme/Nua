import type { IChartApi, ISeriesApi, Time } from "lightweight-charts"
import {
  AreaSeries,
  ColorType,
  createChart,
  LineStyle
} from "lightweight-charts"
import { useEffect, useRef } from "react"

interface PriceChartProps {
  data: {
    time: Time
    value: number
  }[]
  height?: number
  /** Visible time span ending at the last data point; all data if omitted */
  rangeSeconds?: number
}

const colors = {
  backgroundColor: "transparent",
  lineColor: "#2962FF",
  textColor: "#888",
  areaTopColor: "#2962FF",
  areaBottomColor: "rgba(41, 98, 255, 0.28)"
}

export const PriceChart = ({
  data,
  height = 150,
  rangeSeconds
}: PriceChartProps) => {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const seriesRef = useRef<ISeriesApi<"Area"> | null>(null)
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

  // Created once; size, data and range are applied separately
  useEffect(() => {
    const current = chartContainerRef.current
    if (!current) return

    const chart = createChart(current, {
      width: current.clientWidth,
      height: current.clientHeight,
      layout: {
        textColor: colors.textColor,
        attributionLogo: false,
        background: { type: ColorType.Solid, color: colors.backgroundColor }
      },
      timeScale: {
        borderColor: colors.textColor,
        fixRightEdge: true,
        fixLeftEdge: true,
        timeVisible: true
      },
      rightPriceScale: {
        borderColor: colors.textColor
      },
      grid: {
        vertLines: {
          visible: false
        },
        horzLines: {
          color: "rgba(255, 255, 255, 0.1)",
          style: LineStyle.Solid
        }
      }
    })

    seriesRef.current = chart.addSeries(AreaSeries, {
      lineColor: colors.lineColor,
      topColor: colors.areaTopColor,
      bottomColor: colors.areaBottomColor,
      priceFormat: {
        type: "price",
        precision: 4,
        minMove: 0.0001
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
    if (!data?.length) return
    seriesRef.current?.setData(data)
    applyRangeRef.current()
  }, [data, rangeSeconds])

  return <div ref={chartContainerRef} style={{ height }} />
}

export default PriceChart
