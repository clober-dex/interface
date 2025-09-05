import React, { SVGProps } from 'react'

const CloseSvg = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    {...props}
  >
    <path
      d="M3.75 3.75L16.25 16.25"
      stroke="#8D94A1"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M16.2502 3.75L3.75024 16.25"
      stroke="#8D94A1"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
)

export default CloseSvg
