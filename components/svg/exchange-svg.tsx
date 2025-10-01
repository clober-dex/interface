import React, { SVGProps } from 'react'

export const ExchangeSvg = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    {...props}
  >
    <path
      d="M16.6133 10.8675C16.4559 12.0675 15.9749 13.202 15.2218 14.1493C14.4686 15.0967 13.4718 15.8211 12.3383 16.245C11.2047 16.6689 9.9771 16.7763 8.78717 16.5555C7.59723 16.3347 6.48984 15.7942 5.58374 14.9919C4.67765 14.1897 4.00705 13.1558 3.64384 12.0014C3.28064 10.8469 3.23855 9.6154 3.52208 8.43884C3.80561 7.26228 4.40407 6.1851 5.25326 5.32281C6.10246 4.46053 7.17037 3.84567 8.34245 3.54418C11.5916 2.71085 14.955 4.38335 16.1966 7.50002M16.6691 3.33334V7.50001H12.5025"
      className="stroke-blue-400"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)
