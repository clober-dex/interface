import React from 'react'

import { TriangleUpSvg } from '../svg/triangle-up-svg'

export const BalloonModal = ({
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & React.PropsWithChildren) => (
  <div {...props}>
    <div className="absolute flex flex-col items-center left-1/2 -translate-x-1/2">
      <TriangleUpSvg className="fill-current text-[#1f2024]" />
      <div className="z-[1] flex justify-center items-center gap-2.5 w-max">
        {children}
      </div>
    </div>
  </div>
)
