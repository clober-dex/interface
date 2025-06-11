import React, { SVGProps } from 'react'

export const TimerSvg = (props: SVGProps<SVGSVGElement>) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <g clipPath="url(#clip0)">
      <path
        d="M8 2.66667C4.77867 2.66667 2.66667 5.15533 2.66667 8C2.66667 10.8447 4.77867 13.3333 8 13.3333C11.2213 13.3333 13.3333 10.8447 13.3333 8C13.3333 5.15533 11.2213 2.66667 8 2.66667ZM8 12C5.79067 12 4 10.2093 4 8C4 5.79067 5.79067 4 8 4C10.2093 4 12 5.79067 12 8C12 10.2093 10.2093 12 8 12ZM8.66667 8V5.33333H7.33333V8H8.66667ZM8 0.666667C7.63181 0.666667 7.33333 0.965143 7.33333 1.33333V2H8.66667V1.33333C8.66667 0.965143 8.36819 0.666667 8 0.666667ZM10.4714 2.13867L9.52857 3.08143L10.5286 4.08143L11.4714 3.13867L10.4714 2.13867Z"
        fill="#6B7280"
      />
    </g>
    <defs>
      <clipPath id="clip0">
        <rect width="16" height="16" fill="white" />
      </clipPath>
    </defs>
  </svg>
)
