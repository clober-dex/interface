import React from 'react'

export type LegendInfo = { label: string; color: string; value: string }

export function Legend({ data }: { data: LegendInfo[] }) {
  return (
    <div
      id="protocolGraphLegend"
      className="bg-gray-600 absolute pointer-events-none p-2 gap-1.5 rounded-xl border shadow-lg z-50 w-fit"
    >
      {data.map(({ value: display, label, color }) => {
        return (
          <div
            className="flex text-xs lg:text-sm px-2 items-center gap-2 text-nowrap"
            key={`${label}-${color}`}
          >
            <div>{label}</div>
            <div className="w-2 h-2" style={{ backgroundColor: color }} />
            <div>{display}</div>
          </div>
        )
      })}
    </div>
  )
}
