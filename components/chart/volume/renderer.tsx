/**
 * Copied from https://github.com/tradingview/lightweight-charts/blob/master/plugin-examples/src/plugins/stacked-bars-series/renderer.ts
 * Modifications are called out with comments.
 */

import {
  BitmapCoordinatesRenderingScope,
  CanvasRenderingTarget2D,
} from 'fancy-canvas'
import {
  CustomData,
  CustomSeriesOptions,
  ICustomSeriesPaneRenderer,
  PaneRendererCustomData,
  PriceToCoordinateConverter,
  Time,
  UTCTimestamp,
} from 'lightweight-charts'

import {
  calculateColumnPositionsInPlace,
  ColumnPosition,
  isStackedHistogramData,
  positionsBox,
} from './utils'

// Modification: custom implementations of lw-chart's histogram data types
export interface SingleHistogramData extends CustomData {
  value: number
  time: UTCTimestamp
}

export interface StackedHistogramData extends CustomData {
  values: Record<string, number | undefined>
  time: UTCTimestamp
}

export type CustomHistogramData = SingleHistogramData | StackedHistogramData

export function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  radii?: number | DOMPointInit | Iterable<number | DOMPointInit> | undefined,
): void {
  // roundRect might need to polyfilled for older browsers
  if (ctx.roundRect) {
    ctx.beginPath()
    ctx.roundRect(x, y, w, h, radii)
    ctx.fill()
  } else {
    ctx.fillRect(x, y, w, h)
  }
}

interface BarItem {
  x: number
  ys: { y: number; label: string }[]
  column?: ColumnPosition
}

export interface CustomHistogramSeriesOptions extends CustomSeriesOptions {
  colors: string[]
  hoveredXPos?: number
}

function cumulativeBuildUp(data: StackedHistogramData): number[] {
  let sum = 0
  return Object.values(data.values)
    .filter((value: number | undefined): value is number => value !== undefined)
    .map((value) => {
      const newValue = sum + value
      sum = newValue
      return newValue
    })
}

export interface CustomHistogramProps {
  colors: { label: string; color: string }[]
  background?: string
}

export class CustomHistogramSeriesRenderer<TData extends CustomHistogramData>
  implements ICustomSeriesPaneRenderer
{
  _data: PaneRendererCustomData<Time, TData> | null = null
  _options: CustomHistogramSeriesOptions | null = null
  _colors: { label: string; color: string }[]
  _background?: string

  constructor(props: CustomHistogramProps) {
    this._colors = props.colors
    this._background = props.background
  }

  draw(
    target: CanvasRenderingTarget2D,
    priceConverter: PriceToCoordinateConverter,
  ): void {
    target.useBitmapCoordinateSpace((scope) =>
      this._drawImpl(scope, priceConverter, this._options?.hoveredXPos),
    )
  }

  update(
    data: PaneRendererCustomData<Time, TData>,
    options: CustomHistogramSeriesOptions,
  ): void {
    this._data = data
    this._options = options
  }

  _drawImpl(
    renderingScope: BitmapCoordinatesRenderingScope,
    priceToCoordinate: PriceToCoordinateConverter,
    hoveredXPos?: number | null,
  ): void {
    if (
      this._data === null ||
      this._data.bars.length === 0 ||
      this._data.visibleRange === null ||
      this._options === null
    ) {
      return
    }
    const ctx = renderingScope.context
    const bars: BarItem[] = this._data.bars.map((bar) => {
      // Modification: CustomHistogramSeries is generalized to handle both single and stacked histograms
      const cumulativePrice = isStackedHistogramData(bar.originalData)
        ? cumulativeBuildUp(bar.originalData as any)
        : [(bar.originalData as any).value]
      return {
        x: bar.x,
        ys: cumulativePrice.map((value, index) => ({
          y: priceToCoordinate(value) ?? 0,
          label: Object.keys((bar.originalData as any).values)[index],
        })),
      }
    })
    calculateColumnPositionsInPlace(
      bars,
      this._data.barSpacing,
      renderingScope.horizontalPixelRatio,
      this._data.visibleRange.from,
      this._data.visibleRange.to,
    )
    const zeroY = priceToCoordinate(0) ?? 0
    for (
      let i = this._data.visibleRange.from;
      i < this._data.visibleRange.to;
      i++
    ) {
      const stack = bars[i]
      const column = stack.column
      if (!column) {
        return
      }
      let previousY = zeroY
      const width = Math.min(
        Math.max(
          renderingScope.horizontalPixelRatio,
          column.right - column.left,
        ),
        this._data.barSpacing * renderingScope.horizontalPixelRatio,
      )

      // Modification: increase space between bars
      const margin = width * 0.075

      // Modification: draw rounded rect corresponding to total volume
      const totalBox = positionsBox(
        zeroY,
        stack.ys[stack.ys.length - 1].y,
        renderingScope.verticalPixelRatio,
      )

      if (this._background) {
        ctx.fillStyle = this._background
      }

      roundRect(
        ctx,
        column.left + margin,
        totalBox.position,
        width - margin,
        totalBox.length,
        4,
      )

      // Modification: draw the stack's boxes atop the total volume bar, resulting in the top and bottom boxes being rounded
      ctx.globalCompositeOperation = 'source-atop'
      const isStackedHistogram = stack.ys.length > 1
      // Determine if bar is being hovered by checking if the cursor is without the bounds of the bar
      const isHovered =
        hoveredXPos &&
        hoveredXPos >= stack.x - width / 4 &&
        hoveredXPos <= stack.x + width / 4 + 1
      stack.ys.forEach(({ y, label }) => {
        const color = this._colors.find((color) => color.label === label)?.color
        if (!color) {
          return
        }
        const stackBoxPositions = positionsBox(
          previousY,
          y,
          renderingScope.verticalPixelRatio,
        )
        ctx.fillStyle = color
        ctx.globalAlpha = isStackedHistogram && !isHovered ? 0.66 : 1
        ctx.fillRect(
          column.left + margin,
          stackBoxPositions.position,
          width - margin,
          stackBoxPositions.length,
        )
        if (isStackedHistogram && !isHovered) {
          ctx.globalAlpha = 1
          ctx.fillStyle = color
          ctx.fillRect(
            column.left + margin,
            stackBoxPositions.position,
            width - margin,
            2,
          )
        }
        previousY = y
      })

      // reset global settings
      ctx.globalCompositeOperation = 'source-over'
    }
  }
}
