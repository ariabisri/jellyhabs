"use client"

import React from "react"
import ReactECharts from "echarts-for-react"
import { useTheme } from "@/components/theme-provider"

interface PieDataPoint {
  name: string
  value: number
  itemStyle?: { color?: string }
}

export function PieChart({
  title,
  data,
  isDoughnut = true,
  height = "260px",
}: {
  title?: string
  data: PieDataPoint[]
  isDoughnut?: boolean
  height?: string
}) {
  const { theme } = useTheme()
  const isDark = theme === "dark"

  const textColor = isDark ? "#8D99AE" : "#5C6B73"
  const tooltipBg = isDark ? "rgba(28, 37, 65, 0.9)" : "rgba(255, 255, 255, 0.92)"
  const tooltipText = isDark ? "#F8F9FA" : "#0D1B2A"
  const tooltipBorder = isDark ? "rgba(0, 245, 212, 0.3)" : "rgba(0, 180, 216, 0.3)"

  const defaultColors = isDark
    ? ["#EF476F", "#FFD166", "#06D6A0", "#118AB2", "#9D4EDD", "#00F5D4"]
    : ["#E63946", "#F4A261", "#2A9D8F", "#00B4D8", "#7209B7", "#4361EE"]

  const formattedData = data.map((d, idx) => ({
    ...d,
    itemStyle: d.itemStyle || {
      color: defaultColors[idx % defaultColors.length],
    },
  }))

  const option = {
    title: title
      ? {
          text: title,
          left: "center",
          textStyle: {
            fontSize: 14,
            fontWeight: "600",
            color: tooltipText,
          },
        }
      : undefined,
    tooltip: {
      trigger: "item",
      backgroundColor: tooltipBg,
      borderColor: tooltipBorder,
      borderWidth: 1,
      textStyle: {
        color: tooltipText,
      },
      formatter: "{b}: <b>{c}</b> ({d}%)",
    },
    legend: {
      bottom: "0%",
      left: "center",
      textStyle: {
        color: textColor,
        fontSize: 11,
      },
      itemWidth: 10,
      itemHeight: 10,
      itemGap: 12,
    },
    series: [
      {
        name: title || "Distribusi",
        type: "pie",
        radius: isDoughnut ? ["42%", "72%"] : "70%",
        center: ["50%", "45%"],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 6,
          borderColor: isDark ? "#0D1B2A" : "#FFFFFF",
          borderWidth: 2,
        },
        label: {
          show: false,
          position: "center",
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 14,
            fontWeight: "bold",
            color: tooltipText,
          },
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: "rgba(0, 0, 0, 0.5)",
          },
        },
        labelLine: {
          show: false,
        },
        data: formattedData,
      },
    ],
  }

  return (
    <ReactECharts
      option={option}
      style={{ height, width: "100%" }}
      opts={{ renderer: "canvas" }}
    />
  )
}
