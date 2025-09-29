import React, { SVGProps } from 'react'

export const ArrowRightSvg = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="10"
    viewBox="0 0 16 10"
    fill="none"
    {...props}
  >
    <path
      d="M15 5L1 5M15 5L11 1M15 5L11 9"
      className="stroke-blue-400"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)
