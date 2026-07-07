"use client"
import React from 'react';
import ReactECharts from 'echarts-for-react';

export function BarChart({
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
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
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
      data: xAxisData,
      axisTick: {
        alignWithLabel: true
      }
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: 'Jumlah',
        type: 'bar',
        barWidth: '60%',
        data: seriesData,
        itemStyle: {
          color: '#0284c7' // Sky-600
        }
      }
    ]
  };

  return <ReactECharts option={option} style={{ height: '300px', width: '100%' }} />;
}
