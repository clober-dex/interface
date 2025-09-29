import React, { SVGProps } from 'react'

export const CheckSelectedSvg = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    {...props}
  >
    <mask id="path-1-inside-1_182_716" fill="white">
      <rect x="0.00238037" width="16" height="16" rx="1" />
    </mask>
    <rect
      x="0.00238037"
      width="16"
      height="16"
      rx="1"
      fill="#3B82F6"
      className="stroke-blue-400"
      strokeWidth="3"
      mask="url(#path-1-inside-1_182_716)"
    />
    <path
      d="M4.00238 5L8.00238 11L12.0024 5"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)
