"use client"
import React from 'react';
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts';
import { useTheme } from '@/components/theme-provider';

export function LineChart({
  title,
  xAxisData,
  seriesData,
  yAxisLabel,
}: {
  title: string;
  xAxisData: string[];
  seriesData: number[];
  yAxisLabel?: string;
}) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const lineColor = isDark ? "#00F5D4" : "#00B4D8";
  const textColor = isDark ? "#8D99AE" : "#5C6B73";
  const splitLineColor = isDark ? "rgba(0, 245, 212, 0.1)" : "rgba(0, 180, 216, 0.12)";
  const tooltipBg = isDark ? "rgba(28, 37, 65, 0.9)" : "rgba(255, 255, 255, 0.92)";
  const tooltipText = isDark ? "#F8F9FA" : "#0D1B2A";
  const tooltipBorder = isDark ? "rgba(0, 245, 212, 0.3)" : "rgba(0, 180, 216, 0.3)";

  const option = {
    title: {
      text: title,
      left: 'center',
      textStyle: {
        fontSize: 14,
        fontWeight: '600',
        color: tooltipText,
      }
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: tooltipBg,
      borderColor: tooltipBorder,
      borderWidth: 1,
      textStyle: {
        color: tooltipText,
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: xAxisData,
      axisLabel: {
        color: textColor,
      },
      axisLine: {
        lineStyle: {
          color: splitLineColor,
        }
      }
    },
    yAxis: {
      type: 'value',
      name: yAxisLabel || '',
      nameLocation: 'middle',
      nameGap: 40,
      nameTextStyle: {
        color: textColor,
        fontSize: 12,
      },
      axisLabel: {
        color: textColor,
      },
      splitLine: {
        lineStyle: {
          color: splitLineColor,
          type: 'dashed'
        }
      }
    },
    series: [
      {
        name: 'Nilai',
        type: 'line',
        smooth: true,
        symbolSize: 6,
        data: seriesData,
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: isDark ? 'rgba(0, 245, 212, 0.4)' : 'rgba(0, 180, 216, 0.35)' },
            { offset: 1, color: isDark ? 'rgba(0, 245, 212, 0.0)' : 'rgba(0, 180, 216, 0.01)' }
          ])
        },
        itemStyle: {
          color: lineColor,
        },
        lineStyle: {
          width: 3,
          color: lineColor,
        }
      }
    ]
  };

  return <ReactECharts option={option} style={{ height: '300px', width: '100%' }} />;
}

