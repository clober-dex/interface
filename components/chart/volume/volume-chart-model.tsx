import React, { useMemo } from 'react'

import { ChartModelParams } from '../chart-model'
import { ChartHeader } from '../chart-header'
import { formatWithCommas } from '../../../utils/bignumber'

import { SingleHistogramData } from './renderer'
import {
  CustomVolumeChartModel,
  CustomVolumeChartModelParams,
} from './custom-volume-chart-model'
import { getCumulativeVolume } from './utils'

interface VolumeChartModelParams
  extends ChartModelParams<SingleHistogramData>,
    CustomVolumeChartModelParams {
  TooltipBody?: React.FunctionComponent<{ data: SingleHistogramData }>
}

export class VolumeChartModel extends CustomVolumeChartModel<SingleHistogramData> {
  constructor(chartDiv: HTMLDivElement, params: VolumeChartModelParams) {
    super(chartDiv, params)
  }

  updateOptions(params: VolumeChartModelParams) {
    const volumeChartOptions = {
      autoSize: true,
      rightPriceScale: {
        borderVisible: false,
        scaleMargins: {
          top: 0.3,
          bottom: 0,
        },
      },
      handleScale: {
        axisPressedMouseMove: false,
      },
      handleScroll: {
        vertTouchDrag: false,
      },
    }

    super.updateOptions(params, volumeChartOptions)
  }
}

enum HistoryDuration {
  Day = 'DAY',
  FiveMinute = 'FIVE_MINUTE',
  Hour = 'HOUR',
  Max = 'MAX',
  Month = 'MONTH',
  Week = 'WEEK',
  Year = 'YEAR',
}

// eslint-disable-next-line consistent-return
export function formatHistoryDuration(duration: HistoryDuration): string {
  switch (duration) {
    case HistoryDuration.FiveMinute:
      return 'Past five minutes'
    case HistoryDuration.Hour:
      return 'Past hour'
    case HistoryDuration.Day:
      return 'Past day'
    case HistoryDuration.Week:
      return 'Past week'
    case HistoryDuration.Month:
      return 'Past month'
    case HistoryDuration.Year:
      return 'Past year'
    case HistoryDuration.Max:
      return 'All time'
  }
}

export function toHistoryDuration(timePeriod: TimePeriod): HistoryDuration {
  switch (timePeriod) {
    case TimePeriod.HOUR:
      return HistoryDuration.Hour
    case TimePeriod.DAY:
      return HistoryDuration.Day
    case TimePeriod.WEEK:
      return HistoryDuration.Week
    case TimePeriod.MONTH:
      return HistoryDuration.Month
    case TimePeriod.YEAR:
      return HistoryDuration.Year
  }
}

export function VolumeChartHeader({
  crosshairData,
  volumes,
}: {
  crosshairData?: SingleHistogramData
  volumes: SingleHistogramData[]
}) {
  const display = useMemo(() => {
    const displayValues = {
      volume: 0,
      time: '-',
    }

    if (crosshairData === undefined) {
      const cumulativeVolume = getCumulativeVolume(volumes)
      displayValues.volume = cumulativeVolume || 0
      displayValues.time = 'Total'
    } else {
      displayValues.volume = crosshairData.value || 0
      displayValues.time = ''
    }
    return displayValues
  }, [crosshairData, volumes])

  return (
    <ChartHeader
      value={`$${formatWithCommas(Number(display.volume).toFixed(2))}`}
      time={crosshairData?.time}
      timePlaceholder="Total"
    />
  )
}

export enum TimePeriod {
  HOUR = 'H',
  DAY = 'D',
  WEEK = 'W',
  MONTH = 'M',
  YEAR = 'Y',
}
