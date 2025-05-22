import type { Time } from "lightweight-charts"
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
}

export const PriceChart = ({ data, height = 150 }: PriceChartProps) => {
  if (!data) return null

  const colors = {
    backgroundColor: "transparent",
    lineColor: "#2962FF",
    textColor: "#888",
    areaTopColor: "#2962FF",
    areaBottomColor: "rgba(41, 98, 255, 0.28)"
  }

  const chartContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const current = chartContainerRef.current
    if (!current) return

    const handleResize = () => {
      chart.applyOptions({
        width: current.clientWidth
      })
    }

    const chart = createChart(current, {
      layout: {
        textColor: colors.textColor,
        attributionLogo: false,
        background: { type: ColorType.Solid, color: colors.backgroundColor }
      },
      timeScale: {
        borderColor: colors.textColor,
        fixRightEdge: true,
        fixLeftEdge: true
      },
      rightPriceScale: {
        borderColor: colors.textColor
      },
      height,
      width: current.clientWidth,
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

    const newSeries = chart.addSeries(AreaSeries, {
      lineColor: colors.lineColor,
      topColor: colors.areaTopColor,
      bottomColor: colors.areaBottomColor
    })
    newSeries.setData(data)

    handleResize()
    window.addEventListener("resize", handleResize)

    return () => {
      window.removeEventListener("resize", handleResize)

      chart.remove()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data])

  return <div ref={chartContainerRef} />
}

export default PriceChart
