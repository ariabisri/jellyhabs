"use client"
import React from 'react';
import ReactECharts from 'echarts-for-react';

export function LineChart({
  title,
  xAxisData,
  seriesData,
}: {
  title: string;
  xAxisData: string[];
  seriesData: number[];
}) {
  const option = {
    title: {
      text: title,
      left: 'center',
      textStyle: {
        fontSize: 14,
        fontWeight: 'normal',
      }
    },
    tooltip: {
      trigger: 'axis'
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
      data: xAxisData
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: 'Nilai',
        type: 'line',
        smooth: true,
        data: seriesData,
        areaStyle: {
          opacity: 0.2
        },
        itemStyle: {
          color: '#0d9488' // Teal-600
        }
      }
    ]
  };

  return <ReactECharts option={option} style={{ height: '300px', width: '100%' }} />;
}
